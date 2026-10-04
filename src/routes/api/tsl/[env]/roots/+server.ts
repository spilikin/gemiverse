import { loadTsl } from '$lib/tsl/tsl_api.server';
import { error } from '@sveltejs/kit';

/** roots.json exactly as downloaded, the roots the other resources were computed with. */
export async function GET({ params }) {
	const verified = await loadTsl(params.env);
	if (!verified.roots) {
		error(404, 'roots.json could not be downloaded; the embedded roots are used');
	}
	return new Response(Buffer.from(verified.roots), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=60'
		}
	});
}
