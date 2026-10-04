import { loadTsl, summary } from '$lib/tsl/tsl_api.server';
import type { Environment } from '$lib/tsl/tsl_api';
import { json } from '@sveltejs/kit';

/** The verdict of the environment's TSL; an invalid list is a 200 with result "invalid". */
export async function GET({ params }) {
	const verified = await loadTsl(params.env);
	return json(summary(params.env as Environment, verified.view), {
		headers: { 'Cache-Control': 'public, max-age=60' }
	});
}
