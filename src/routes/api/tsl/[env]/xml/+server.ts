import { loadTsl } from '$lib/tsl/tsl_api.server';

/** The TSL exactly as downloaded, the bytes the other resources were computed from. */
export async function GET({ params }) {
	const verified = await loadTsl(params.env);
	return new Response(Buffer.from(verified.xml), {
		headers: {
			'Content-Type': 'application/xml',
			'Content-Disposition': `inline; filename="tsl-${params.env}.xml"`,
			'Cache-Control': 'public, max-age=60'
		}
	});
}
