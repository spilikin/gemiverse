import type { PageLoad } from './$types';
import type {
	Catalog,
	ServiceId,
	ServiceInstance,
	ServiceType,
	Identifier
} from '$lib/catalog/catalog';

export type InstanceRow = {
	serviceId: ServiceId;
	type: ServiceType;
	url: string;
};

export type RoutingRow = {
	identifier: Identifier;
	serviceId: ServiceId;
	instance: ServiceInstance | null;
};

export type RoutingGroup = {
	serviceType: ServiceType;
	rows: RoutingRow[];
};

export const load: PageLoad = async ({ fetch, params }) => {
	const catalog: Catalog = await fetch(`/api/catalog/${params.env}`).then((res) => res.json());

	const instances: InstanceRow[] = Object.entries(catalog.service_instances)
		.map(([serviceId, instance]) => ({ serviceId, type: instance.type, url: instance.url }))
		.sort((a, b) => a.type.localeCompare(b.type) || a.serviceId.localeCompare(b.serviceId));

	const routingByType: RoutingGroup[] = Object.entries(catalog.routing)
		.map(([serviceType, table]) => ({
			serviceType,
			rows: Object.entries(table)
				.map(([identifier, serviceId]) => ({
					identifier,
					serviceId,
					instance: catalog.service_instances[serviceId] ?? null
				}))
				.sort((a, b) => a.identifier.localeCompare(b.identifier))
		}))
		.sort((a, b) => a.serviceType.localeCompare(b.serviceType));

	return {
		env: params.env,
		catalog,
		instances,
		routingByType
	};
};
