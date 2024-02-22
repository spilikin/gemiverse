import type { PageLoad } from './$types';
import type { Federation } from '$lib/federations';

export const load: PageLoad = ({ fetch, params }) => {

    return fetch(`/api/federations/${params.env}`).then(res => res.json()).then((fed: Federation) => {
        return {
            fed: fed,
            env: params.env
        }
    })
};