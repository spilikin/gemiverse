import { openValkey } from './cache.server';

type CacheRecord<T> = {
	etag?: string;
	lastModified?: string;
	value: T;
	validUntil: number;
};

const DEFAULT_MAX_AGE = 60;

function parseMaxAge(cacheControl: string | null): number | null {
	if (!cacheControl) return null;
	const m = /(?:^|,\s*)max-age\s*=\s*(\d+)/i.exec(cacheControl);
	return m ? parseInt(m[1], 10) : null;
}

export type ConditionalFetchOptions = {
	defaultMaxAge?: number;
};

export async function fetchJsonConditional<T>(
	key: string,
	url: string,
	opts: ConditionalFetchOptions = {}
): Promise<T | null> {
	const valkey = openValkey();
	const cached = await valkey.get(key);
	const record: CacheRecord<T> | null = cached ? (JSON.parse(cached) as CacheRecord<T>) : null;

	const now = Math.floor(Date.now() / 1000);
	if (record && record.validUntil > now) {
		return record.value;
	}

	const headers: Record<string, string> = { Accept: 'application/json' };
	if (record?.etag) headers['If-None-Match'] = record.etag;
	if (record?.lastModified) headers['If-Modified-Since'] = record.lastModified;

	const response = await fetch(url, { headers });

	const fallback = opts.defaultMaxAge ?? DEFAULT_MAX_AGE;
	const maxAge = parseMaxAge(response.headers.get('cache-control')) ?? fallback;
	const validUntil = now + maxAge;

	if (response.status === 304 && record) {
		const refreshed: CacheRecord<T> = { ...record, validUntil };
		await valkey.set(key, JSON.stringify(refreshed));
		return record.value;
	}

	if (response.status === 200) {
		const value = (await response.json()) as T;
		const next: CacheRecord<T> = {
			etag: response.headers.get('etag') ?? undefined,
			lastModified: response.headers.get('last-modified') ?? undefined,
			value,
			validUntil
		};
		await valkey.set(key, JSON.stringify(next));
		return value;
	}

	console.error('fetchJsonConditional: unexpected status', response.status, 'for', url);
	return record ? record.value : null;
}
