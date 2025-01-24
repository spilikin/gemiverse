import { getFederation } from '$lib/federations.server';
import { error, json } from '@sveltejs/kit';

export async function GET(event) {
    const env = event.params.env;
    const fed = await getFederation(env).then((fed) => {
        return fed;
    }).catch((err) => {
        console.error('error fetching federation for', env, err);
        return error(500, 'Error fetching federation');
    })
    if (!fed) {
        return error(404, 'Federation not found');
    }
    return json(fed);  
}
