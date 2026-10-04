import { DownloadError, getVerifiedTsl, isTslEnv } from '$lib/tsl/tsl_verified.server';
import { error } from '@sveltejs/kit';

/** The TSL exactly as downloaded, the bytes the verified view was computed from. */
export async function GET(event) {
	const env = event.params.env;
	if (!isTslEnv(env)) {
		return error(404, 'Unknown environment');
	}
	const verified = await getVerifiedTsl(env).catch((err) => {
		console.error('error loading TSL for', env, err);
		return err instanceof DownloadError
			? error(502, 'TSL download failed')
			: error(500, 'Error loading TSL');
	});
	return new Response(Buffer.from(verified.xml), {
		headers: {
			'Content-Type': 'application/xml',
			'Content-Disposition': `inline; filename="tsl-${env}.xml"`,
			'Cache-Control': 'public, max-age=60'
		}
	});
}
