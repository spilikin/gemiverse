import { fetchEntity } from '$lib/federations';
import { json } from '@sveltejs/kit';

export async function GET(event) {
    const entityId = event.params.entityId;
    // restore the iss url by prepending https:// and replaxxing $ with /
    const iss = "https://"+entityId.replaceAll('$', '/');
    console.log('fetching entity', entityId, 'as', iss)
    const entity = await fetchEntity(iss)
    return json(entity);
}
