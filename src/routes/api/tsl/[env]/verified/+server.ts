import { DownloadError, getVerifiedTsl, isTslEnv, summarize } from '$lib/tsl/tsl_verified.server';
import { error, json } from '@sveltejs/kit';

/**
 * The TSL of the environment verified by ti-wasm. An invalid list is still a 200 with
 * `view.result: "invalid"`. Certificates come as summaries unless `?certificates=full`.
 */
export async function GET(event) {
	const env = event.params.env;
	if (!isTslEnv(env)) {
		return error(404, 'Unknown environment');
	}
	const verified = await getVerifiedTsl(env).catch((err) => {
		console.error('error verifying TSL for', env, err);
		return err instanceof DownloadError
			? error(502, 'TSL download failed')
			: error(500, 'Error verifying TSL');
	});
	const full = event.url.searchParams.get('certificates') === 'full';
	const { view, sources, wasm, computed_at } = verified;
	const certificates = full
		? view.certificates
		: Object.fromEntries(
				Object.entries(view.certificates).map(([fp, info]) => [fp, summarize(info)])
			);
	return json(
		{ sources, wasm, computed_at, view: { ...view, certificates } },
		{ headers: { 'Cache-Control': 'public, max-age=60' } }
	);
}
