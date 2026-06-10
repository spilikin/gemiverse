import Atlas from '../atlas';
import { fetchJsonConditional } from '../http_cache.server';
import type { Catalog } from './catalog';

export async function getCatalog(env: string): Promise<Catalog | null> {
	const cfg = Atlas.catalog[env as keyof typeof Atlas.catalog];
	if (!cfg) return null;
	return fetchJsonConditional<Catalog>(`catalog:${env}`, cfg.url);
}
