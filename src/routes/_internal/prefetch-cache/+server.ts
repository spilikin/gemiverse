import { prefetchFederationCache } from '$lib/federations.server';
import { json } from '@sveltejs/kit';

export async function POST(event) {
    await prefetchFederationCache();
    return json({status: 'ok'});
}
