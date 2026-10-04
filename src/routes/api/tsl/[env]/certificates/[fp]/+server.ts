import {
	DownloadError,
	certificateDetail,
	getVerifiedTsl,
	isTslEnv
} from '$lib/tsl/tsl_verified.server';
import { error, json } from '@sveltejs/kit';

/** A certificate the verified TSL names: details, where it occurs, and its chain. */
export async function GET(event) {
	const { env, fp } = event.params;
	if (!isTslEnv(env)) {
		return error(404, 'Unknown environment');
	}
	if (!/^[0-9a-f]{64}$/.test(fp)) {
		return error(404, 'Not a certificate fingerprint');
	}
	const verified = await getVerifiedTsl(env).catch((err) => {
		console.error('error verifying TSL for', env, err);
		return err instanceof DownloadError
			? error(502, 'TSL download failed')
			: error(500, 'Error verifying TSL');
	});
	const detail = certificateDetail(verified.view, fp);
	if (!detail) {
		return error(404, 'Certificate not in the TSL');
	}
	return json(
		{
			environment: env,
			result: verified.view.result,
			sequence_number: verified.view.list?.sequence_number ?? null,
			...detail
		},
		{ headers: { 'Cache-Control': 'public, max-age=60' } }
	);
}
