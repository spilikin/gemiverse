import type { PageLoad } from './$types';
import type { ServiceDetail } from '$lib/tsl/tsl_api';
import { getResource } from '$lib/tsl/tsl_fetch';

export const load: PageLoad = async ({ fetch, params }) => {
	const service = await getResource<ServiceDetail>(
		fetch,
		`/api/tsl/${params.env}/services/${params.id}`
	);
	return { service, title: service.name };
};
