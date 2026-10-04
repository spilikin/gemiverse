import { createHash } from 'node:crypto';
import Atlas from '../atlas';
import { fetchBytesConditional } from '../http_cache.server';
import { trustUrls, verifyTsl, wasmVersion } from '../ti/ti_wasm.server';
import type { TrustUrls, TslView } from '$ti-wasm/types';
import type { Source } from './tsl_api';

/** How long past NextUpdate a list is still shown as valid, with validity_warning_1. */
const GRACE_SECONDS = 7 * 24 * 3600;
/** The view depends on the time too (validity, overdue), so it is recomputed this often. */
const VIEW_TTL_MS = 10 * 60 * 1000;
/** The TSL hosts send no max-age; the list changes about once a week. */
const DOWNLOAD_MAX_AGE = 30 * 60;

export class DownloadError extends Error {}

export type VerifiedTsl = {
	view: TslView;
	xml: Uint8Array;
	/** roots.json as downloaded; null when it could not be, and the module used its embedded roots. */
	roots: Uint8Array | null;
	sources: { tsl: Source; roots: Source | null };
	wasm: { ti_wasm: string; commit: string; wasm_sha256: string };
	computed_at: string;
};

export function isTslEnv(env: string): env is keyof typeof Atlas.tsl {
	return Object.hasOwn(Atlas.tsl, env);
}

const urls = new Map<string, Promise<TrustUrls>>();
const views = new Map<string, { key: string; at: number; result: Promise<VerifiedTsl> }>();

function sha256(bytes: Uint8Array): string {
	return createHash('sha256').update(bytes).digest('hex');
}

function source(
	url: string,
	fetched: { value: Uint8Array; fetchedAt: number; stale: boolean }
): Source {
	return {
		url,
		fetched_at: fetched.fetchedAt ? new Date(fetched.fetchedAt * 1000).toISOString() : null,
		stale: fetched.stale,
		sha256: sha256(fetched.value)
	};
}

/**
 * The TSL of `env`, downloaded through the Valkey cache and verified by ti-wasm, with its
 * roots.json if that downloads (the module's embedded roots otherwise). The view is kept
 * in memory per (TSL, roots, module) for VIEW_TTL_MS; concurrent callers share one run.
 *
 * @throws DownloadError if the TSL is neither downloadable nor cached.
 */
export async function getVerifiedTsl(env: keyof typeof Atlas.tsl): Promise<VerifiedTsl> {
	if (!urls.has(env)) {
		urls.set(
			env,
			trustUrls(env).catch((err) => (urls.delete(env), Promise.reject(err)))
		);
	}
	const { tsl_url, roots_url } = await urls.get(env)!;

	const [tsl, roots] = await Promise.all([
		fetchBytesConditional(`tsl:xml:${env}`, tsl_url, {
			defaultMaxAge: DOWNLOAD_MAX_AGE,
			accept: 'application/xml'
		}).catch((err) => {
			console.error('TSL download failed for', env, err);
			return null;
		}),
		fetchBytesConditional(`roots:${env}`, roots_url, {
			defaultMaxAge: DOWNLOAD_MAX_AGE,
			accept: 'application/json'
		}).catch((err) => {
			console.error('roots.json download failed for', env, err);
			return null;
		})
	]);
	if (!tsl) {
		throw new DownloadError(`TSL of ${env} could not be downloaded from ${tsl_url}`);
	}

	const version = wasmVersion();
	const tslSource = source(tsl_url, tsl);
	const rootsSource = roots ? source(roots_url, roots) : null;
	const key = `${tslSource.sha256}:${rootsSource?.sha256 ?? '-'}:${version.wasm_sha256}`;
	const memo = views.get(env);
	if (memo && memo.key === key && Date.now() - memo.at < VIEW_TTL_MS) {
		return memo.result;
	}

	const now = new Date();
	const result = verifyTsl(tsl.value, env, now, roots?.value, GRACE_SECONDS).then((view) => ({
		view,
		xml: tsl.value,
		roots: roots?.value ?? null,
		sources: { tsl: tslSource, roots: rootsSource },
		wasm: {
			ti_wasm: version.ti_wasm,
			commit: version.commit,
			wasm_sha256: version.wasm_sha256
		},
		computed_at: now.toISOString()
	}));
	views.set(env, { key, at: Date.now(), result });
	result.catch(() => {
		if (views.get(env)?.result === result) views.delete(env);
	});
	return result;
}
