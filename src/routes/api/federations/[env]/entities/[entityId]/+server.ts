import { decodeEntityIdentifier } from '$lib/federations';
import { getEntity } from '$lib/federations.server';
import { json } from '@sveltejs/kit';

export async function GET(event) {
    const iss = decodeEntityIdentifier(event.params.entityId)
    const entity = await getEntity(event.params.env, iss, true)
    return json(entity);
}
