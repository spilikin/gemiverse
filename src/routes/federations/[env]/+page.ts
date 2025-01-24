import type { PageLoad } from './$types';
import type { Entity, Federation } from '$lib/federations';

function sortEntities(a: Entity, b: Entity) {
    return (a.statement?.metadata.federation_entity?.name ?? "").localeCompare(b.statement?.metadata.openid_relying_party?.client_name ?? "");
}

export const load: PageLoad = ({ fetch, params }) => {

    return fetch(`/api/federations/${params.env}`).then(res => res.json()).then((fed: Federation) => {
        return {
            fed: fed,
            allEntities: fed.entities.sort(sortEntities),
            opEntities: fed.entities.filter((entity) => entity.statement?.metadata.openid_provider !== undefined).sort(sortEntities),
            rpEntities: fed.entities.filter((entity) => entity.statement?.metadata.openid_relying_party !== undefined).sort(sortEntities),
            env: params.env
        }
    })
};