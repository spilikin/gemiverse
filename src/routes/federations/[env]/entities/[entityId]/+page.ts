import type { PageLoad } from './$types';
import type { Entity } from '$lib/federations/federations';
import { error } from '@sveltejs/kit';

export const load: PageLoad = ({ fetch, params }) => {
	return fetch(`/api/federations/${params.env}/entities/${params.entityId}`)
		.then((res) => {
			if (res.status == 404) {
				throw error(404, 'Entity not found');
			}
			if (res.status != 200) {
				return res.json().then((body) => {
					throw error(res.status, body.error || 'Error fetching entity');
				});
			}
			return res.json();
		})
		.then((entity: Entity) => {
			return {
				entity: entity,
				env: params.env
			};
		});
};
