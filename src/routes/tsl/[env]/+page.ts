import type { PageLoad } from './$types';
import type { ITrustServiceStatusList } from '$lib/tsl/tsl';

export const load: PageLoad = ({ fetch, params }) => {

    return fetch(`/api/tsl/${params.env}`).then(res => res.json()).then((tsl: ITrustServiceStatusList) => {
        return {
            tsl: tsl,
            env: params.env
        }
    })
};