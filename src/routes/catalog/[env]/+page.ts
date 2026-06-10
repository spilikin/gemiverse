import type { PageLoad } from './$types';
import type { Catalog, Identifier } from '$lib/catalog/catalog';
import abrik from '$lib/catalog/abrik.json';

export type VsdmRow = {
	identifier: Identifier;
	name: string | null;
	fachdienst: string | null;
};

export const load: PageLoad = async ({ fetch, params }) => {
	const catalog: Catalog = await fetch(`/api/catalog/${params.env}`).then((res) => res.json());

	const labels = abrik.entries as Record<string, { name: string }>;
	const vsdmRouting = catalog.routing.vsdm ?? {};
	const vsdmRows: VsdmRow[] = Object.entries(vsdmRouting)
		.map(([identifier, serviceId]) => ({
			identifier,
			name: labels[identifier]?.name ?? null,
			fachdienst: catalog.service_instances[serviceId]?.url ?? null
		}))
		.sort((a, b) => a.identifier.localeCompare(b.identifier));

	return {
		env: params.env,
		catalog,
		vsdmRows
	};
};
