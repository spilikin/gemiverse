export type ServiceId = string;
export type ServiceType = string;
export type Identifier = string;

export type ServiceInstance = {
	type: ServiceType;
	url: string;
};

export type Catalog = {
	format_version: string;
	updated_at: number;
	env: string;
	service_instances: Record<ServiceId, ServiceInstance>;
	routing: Record<ServiceType, Record<Identifier, ServiceId>>;
};
