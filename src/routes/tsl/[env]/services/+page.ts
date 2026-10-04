import type { PageLoad } from './$types';
import type { ServiceList } from '$lib/tsl/tsl_api';
import { getResource } from '$lib/tsl/tsl_fetch';

export const load: PageLoad = async ({ fetch, params }) => ({
	list: await getResource<ServiceList>(fetch, `/api/tsl/${params.env}/services`)
});
