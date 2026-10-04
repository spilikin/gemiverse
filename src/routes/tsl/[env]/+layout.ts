import type { LayoutLoad } from './$types';
import type { TslSummary } from '$lib/tsl/tsl_api';
import { getResource } from '$lib/tsl/tsl_fetch';

export const load: LayoutLoad = async ({ fetch, params }) => ({
	env: params.env,
	summary: await getResource<TslSummary>(fetch, `/api/tsl/${params.env}`)
});
