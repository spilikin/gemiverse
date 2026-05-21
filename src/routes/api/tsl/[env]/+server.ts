import { getTsl } from '$lib/tsl/tsl.server';
import { error, json } from '@sveltejs/kit';

export async function GET(event) {
	const env = event.params.env;
	const tsl = await getTsl(env)
		.then((tsl) => {
			return tsl;
		})
		.catch((err) => {
			console.error('error fetching TSL for', env, err);
			return error(500, 'Error fetching TSL');
		});
	if (!tsl) {
		return error(404, 'TSL not found');
	}
	return json(tsl);
}
