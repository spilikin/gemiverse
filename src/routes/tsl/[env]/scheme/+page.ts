import type { PageLoad } from './$types';
import type { SchemeDetail } from '$lib/tsl/tsl_api';
import { getResource } from '$lib/tsl/tsl_fetch';

export const load: PageLoad = async ({ fetch, params }) => ({
	scheme: await getResource<SchemeDetail>(fetch, `/api/tsl/${params.env}/scheme`)
});
