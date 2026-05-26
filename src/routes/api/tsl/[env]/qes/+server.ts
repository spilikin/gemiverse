import { getTslQes } from '$lib/tsl/tsl.server';
import { error, json } from '@sveltejs/kit';

export async function GET(event) {
	const env = event.params.env;
	const tsl = await getTslQes(env)
		.then((tsl) => {
			return tsl;
		})
		.catch((err) => {
			console.error('error fetching QES-TSL for', env, err);
			return error(500, 'Error fetching QES-TSL');
		});
	if (!tsl) {
		return error(404, 'QES-TSL not found');
	}
	return json(tsl);
}
