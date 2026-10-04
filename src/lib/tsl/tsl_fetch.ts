import { error } from '@sveltejs/kit';

/** GET an /api/tsl resource in a load function; its HTTP error becomes the page's. */
export async function getResource<T>(fetch: typeof globalThis.fetch, path: string): Promise<T> {
	const res = await fetch(path);
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		error(res.status, body.message ?? 'Error loading the TSL');
	}
	return (await res.json()) as T;
}
