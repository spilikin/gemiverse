import { loadTsl, schemeDetail } from '$lib/tsl/tsl_api.server';
import { error, json } from '@sveltejs/kit';

/** The list's scheme information; 404 for an invalid list, which has none to trust. */
export async function GET({ params }) {
	const verified = await loadTsl(params.env);
	const scheme = schemeDetail(verified.view);
	if (!scheme) {
		error(404, 'The list is invalid');
	}
	return json(scheme, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
