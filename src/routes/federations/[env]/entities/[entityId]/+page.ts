import type { PageLoad } from './$types';
import type { Entity } from '$lib/federations';

export const load: PageLoad = ({ fetch, params }) => {

    return fetch(`/api/federations/${params.env}/entities/${params.entityId}`).then(res => res.json()).then((entity: Entity) => {
        return {
            entity: entity,
            env: params.env
        }
    })
};