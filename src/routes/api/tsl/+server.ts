import Atlas from '$lib/atlas';
import { summary } from '$lib/tsl/tsl_api.server';
import type { Environment, TslIndex } from '$lib/tsl/tsl_api';
import { getVerifiedTsl } from '$lib/tsl/tsl_verified.server';
import { json } from '@sveltejs/kit';

/** Every environment's TSL verdict; one that cannot be loaded is listed with the reason. */
export async function GET() {
	const envs = Object.keys(Atlas.tsl) as Environment[];
	const environments = await Promise.all(
		envs.map(async (env): Promise<TslIndex['environments'][number]> => {
			try {
				return { available: true, ...summary(env, (await getVerifiedTsl(env)).view) };
			} catch (err) {
				console.error('error verifying TSL for', env, err);
				return { available: false, environment: env, message: 'TSL could not be loaded' };
			}
		})
	);
	return json({ environments } satisfies TslIndex, {
		headers: { 'Cache-Control': 'public, max-age=60' }
	});
}
