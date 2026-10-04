import { loadTsl, serviceList } from '$lib/tsl/tsl_api.server';
import { json } from '@sveltejs/kit';

/** Every service of the TSL with its chain verdict; empty for an invalid list. */
export async function GET({ params }) {
	const verified = await loadTsl(params.env);
	return json(serviceList(verified.view), { headers: { 'Cache-Control': 'public, max-age=60' } });
}
