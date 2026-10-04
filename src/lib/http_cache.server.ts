import { openValkey } from './cache.server';

type CacheRecord<T> = {
	etag?: string;
	lastModified?: string;
	value: T;
	validUntil: number;
	fetchedAt?: number;
};

const DEFAULT_MAX_AGE = 60;

function parseMaxAge(cacheControl: string | null): number | null {
	if (!cacheControl) return null;
	const m = /(?:^|,\s*)max-age\s*=\s*(\d+)/i.exec(cacheControl);
	return m ? parseInt(m[1], 10) : null;
}

export type ConditionalFetchOptions = {
	defaultMaxAge?: number;
	accept?: string;
};

export type Fetched<T> = {
	value: T;
	/** Unix seconds of the download or the last 304 that confirmed it. */
	fetchedAt: number;
	/** The upstream failed and the cached value was served instead. */
	stale: boolean;
};

/**
 * Fetches `url` with the ETag/Last-Modified of the record cached under `key`, honouring
 * the upstream max-age. `codec` turns the value into what Valkey stores. When the request
 * fails, a cached value is served as stale; without one the error propagates, while an
 * unexpected status yields null.
 */
export async function fetchConditional<T, S>(
	key: string,
	url: string,
	read: (response: Response) => Promise<T>,
	codec: { encode: (value: T) => S; decode: (stored: S) => T },
	opts: ConditionalFetchOptions = {}
): Promise<Fetched<T> | null> {
	const valkey = openValkey();
	const cached = await valkey.get(key);
	const record: CacheRecord<S> | null = cached ? (JSON.parse(cached) as CacheRecord<S>) : null;
	const fromRecord = (r: CacheRecord<S>, stale: boolean): Fetched<T> => ({
		value: codec.decode(r.value),
		fetchedAt: r.fetchedAt ?? 0,
		stale
	});

	const now = Math.floor(Date.now() / 1000);
	if (record && record.validUntil > now) {
		return fromRecord(record, false);
	}

	const headers: Record<string, string> = { Accept: opts.accept ?? '*/*' };
	if (record?.etag) headers['If-None-Match'] = record.etag;
	if (record?.lastModified) headers['If-Modified-Since'] = record.lastModified;

	let response: Response;
	try {
		response = await fetch(url, { headers });
	} catch (err) {
		if (!record) throw err;
		console.error('fetchConditional: request failed for', url, err);
		return fromRecord(record, true);
	}

	const fallback = opts.defaultMaxAge ?? DEFAULT_MAX_AGE;
	const maxAge = parseMaxAge(response.headers.get('cache-control')) ?? fallback;
	const validUntil = now + maxAge;

	if (response.status === 304 && record) {
		const refreshed: CacheRecord<S> = { ...record, validUntil, fetchedAt: now };
		await valkey.set(key, JSON.stringify(refreshed));
		return fromRecord(refreshed, false);
	}

	if (response.status === 200) {
		const value = await read(response);
		const next: CacheRecord<S> = {
			etag: response.headers.get('etag') ?? undefined,
			lastModified: response.headers.get('last-modified') ?? undefined,
			value: codec.encode(value),
			validUntil,
			fetchedAt: now
		};
		await valkey.set(key, JSON.stringify(next));
		return { value, fetchedAt: now, stale: false };
	}

	console.error('fetchConditional: unexpected status', response.status, 'for', url);
	return record ? fromRecord(record, true) : null;
}

export async function fetchJsonConditional<T>(
	key: string,
	url: string,
	opts: ConditionalFetchOptions = {}
): Promise<T | null> {
	const fetched = await fetchConditional<T, T>(
		key,
		url,
		(response) => response.json() as Promise<T>,
		{ encode: (v) => v, decode: (v) => v },
		{ accept: 'application/json', ...opts }
	);
	return fetched ? fetched.value : null;
}

/**
 * The body exactly as served, for documents whose bytes matter (signed XML): no text
 * decoding, which would drop a BOM or replace invalid sequences. Stored as base64.
 */
export async function fetchBytesConditional(
	key: string,
	url: string,
	opts: ConditionalFetchOptions = {}
): Promise<Fetched<Uint8Array> | null> {
	return fetchConditional<Uint8Array, string>(
		key,
		url,
		async (response) => new Uint8Array(await response.arrayBuffer()),
		{
			encode: (v) => Buffer.from(v).toString('base64'),
			decode: (s) => new Uint8Array(Buffer.from(s, 'base64'))
		},
		opts
	);
}
