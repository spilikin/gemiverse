import { loadTsl, signatureDetail } from '$lib/tsl/tsl_api.server';
import { json } from '@sveltejs/kit';

/** How the TSL was verified: signer, TSL signer CA, warnings, roots and sources. */
export async function GET({ params }) {
	const verified = await loadTsl(params.env);
	return json(signatureDetail(verified), { headers: { 'Cache-Control': 'public, max-age=60' } });
}
