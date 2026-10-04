import { createHash } from 'node:crypto';
import Atlas from '../atlas';
import { fetchBytesConditional } from '../http_cache.server';
import { trustUrls, verifyTsl, wasmVersion } from '../ti/ti_wasm.server';
import type { CertificateInfo, Fingerprint, TrustUrls, TslView } from '$ti-wasm/types';

/** How long past NextUpdate a list is still shown as valid, with validity_warning_1. */
const GRACE_SECONDS = 7 * 24 * 3600;
/** The view depends on the time too (validity, overdue), so it is recomputed this often. */
const VIEW_TTL_MS = 10 * 60 * 1000;
/** The TSL hosts send no max-age; the list changes about once a week. */
const DOWNLOAD_MAX_AGE = 30 * 60;

export class DownloadError extends Error {}

export type Source = {
	url: string;
	fetched_at: string | null;
	/** The upstream failed; the cached copy was used. */
	stale: boolean;
	sha256: string;
};

export type VerifiedTsl = {
	view: TslView;
	xml: Uint8Array;
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

export type CertificateSummary = Pick<
	CertificateInfo,
	| 'subject'
	| 'issuer'
	| 'serial'
	| 'not_before'
	| 'not_after'
	| 'validity'
	| 'key'
	| 'certificate_type'
	| 'ca'
>;

export function summarize(info: CertificateInfo): CertificateSummary {
	const { subject, issuer, serial, not_before, not_after, validity, key, certificate_type, ca } =
		info;
	return { subject, issuer, serial, not_before, not_after, validity, key, certificate_type, ca };
}

/** Where a certificate occurs in the view. */
export type CertificateRole =
	| { role: 'tsl_signer' }
	| { role: 'tsl_signer_ca' }
	| { role: 'root' }
	| {
			role: 'service';
			provider: string;
			service: TslView['providers'][number]['services'][number];
	  };

export type CertificateDetail = {
	fingerprint: Fingerprint;
	certificate: CertificateInfo;
	roles: CertificateRole[];
	/** From this certificate up to a verified root, or as far as it was built. */
	chain: { fingerprint: Fingerprint; certificate: CertificateSummary }[];
	trusted: boolean;
	rejection: string | null;
};

/** Everything the view knows about the certificate `fp`; null if it names none. */
export function certificateDetail(view: TslView, fp: Fingerprint): CertificateDetail | null {
	const certificate = view.certificates[fp];
	if (!certificate) return null;

	const roles: CertificateRole[] = [];
	if (view.signature?.signer === fp) roles.push({ role: 'tsl_signer' });
	if (view.signature?.tsl_signer_ca === fp) roles.push({ role: 'tsl_signer_ca' });
	const isRoot = view.roots?.trusted.some((r) => r.fingerprint === fp) ?? false;
	if (isRoot) roles.push({ role: 'root' });
	for (const provider of view.providers) {
		for (const service of provider.services) {
			if (service.certificate === fp) {
				roles.push({ role: 'service', provider: provider.name, service });
			}
		}
	}

	const withChain = roles.find(
		(r): r is Extract<CertificateRole, { role: 'service' }> =>
			r.role === 'service' && r.service.chain !== null
	)?.service.chain;
	// The TSL signer chains to the embedded TSL signer CA, not to a root; the view only
	// names both once the signature verified.
	const signature = view.signature;
	const signerPath = signature?.signer === fp ? [fp, signature.tsl_signer_ca] : null;
	const path = withChain?.path ?? signerPath ?? [fp];
	const anchored = isRoot || signature?.tsl_signer_ca === fp || signerPath !== null;
	return {
		fingerprint: fp,
		certificate,
		roles,
		chain: path.map((p) => ({ fingerprint: p, certificate: summarize(view.certificates[p]) })),
		trusted: withChain ? withChain.trusted : anchored,
		rejection: withChain?.rejection ?? null
	};
}
