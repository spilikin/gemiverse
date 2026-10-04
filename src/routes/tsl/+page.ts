import type { PageLoad } from './$types';
import type { TslIndex } from '$lib/tsl/tsl_api';
import { getResource } from '$lib/tsl/tsl_fetch';

export const load: PageLoad = async ({ fetch }) => ({
	index: await getResource<TslIndex>(fetch, '/api/tsl')
});
