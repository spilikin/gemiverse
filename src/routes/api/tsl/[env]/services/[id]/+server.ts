import { loadTsl, serviceDetail } from '$lib/tsl/tsl_api.server';
import { error, json } from '@sveltejs/kit';

/** A service by its certificate's SHA-256 fingerprint: TSL entries, chain and certificate. */
export async function GET({ params }) {
	if (!/^[0-9a-f]{64}$/.test(params.id)) {
		error(404, 'Service not found');
	}
	const verified = await loadTsl(params.env);
	const detail = serviceDetail(verified.view, params.id);
	if (!detail) {
		error(404, 'Service not found');
	}
	return json(detail, { headers: { 'Cache-Control': 'public, max-age=60' } });
}
