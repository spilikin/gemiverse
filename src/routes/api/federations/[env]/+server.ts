import { getFederation, type Federation } from '$lib/federations';
import { json } from '@sveltejs/kit';

var fed: Federation | undefined = undefined

export async function GET(event) {
    const env = event.params.env;
    const fed = await getFederation(env!)
    return json(fed);
}
