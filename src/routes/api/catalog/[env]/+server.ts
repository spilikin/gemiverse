import { getCatalog } from '$lib/catalog/catalog.server';
import { error, json } from '@sveltejs/kit';

export async function GET(event) {
	const env = event.params.env;
	const catalog = await getCatalog(env).catch((err) => {
		console.error('error fetching catalog for', env, err);
		return error(500, 'Error fetching catalog');
	});
	if (!catalog) {
		return error(404, 'Catalog not found');
	}

	const etag = `"catalog-${env}-${catalog.format_version}-${catalog.updated_at}"`;
	const ifNoneMatch = event.request.headers.get('if-none-match');
	const headers = {
		ETag: etag,
		'Cache-Control': 'public, max-age=60'
	};

	if (ifNoneMatch && ifNoneMatch === etag) {
		return new Response(null, { status: 304, headers });
	}

	return json(catalog, { headers });
}
