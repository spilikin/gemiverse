import { decodeEntityIdentifier } from '$lib/federations/federations';
import { getEntity, getFederation } from '$lib/federations/federations.server';
import { json } from '@sveltejs/kit';

export async function GET(event) {
	const iss = decodeEntityIdentifier(event.params.entityId);
	const federation = await getFederation(event.params.env);
	if (!federation) {
		return json({ error: 'Federation not found' }, { status: 404 });
	}
	if (!federation.entities.find((entity) => entity.iss === iss)) {
		return json({ error: 'Entity not found in federation' }, { status: 404 });
	}
	let entity;
	try {
		entity = await getEntity(event.params.env, iss, true);
	} catch (e) {
		return json({ error: (e as Error).message }, { status: 500 });
	}
	return json(entity);
}
