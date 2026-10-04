import type { PageLoad } from './$types';
import type { SignatureDetail } from '$lib/tsl/tsl_api';
import { getResource } from '$lib/tsl/tsl_fetch';

export const load: PageLoad = async ({ fetch, params }) => ({
	signature: await getResource<SignatureDetail>(fetch, `/api/tsl/${params.env}/signature`)
});
