import { getFederationExportXLSX } from '$lib/federations/federations.server';
import { error } from '@sveltejs/kit';

export async function GET(event) {
	const env = event.params.env;
	const bytes = await getFederationExportXLSX(env, true)
		.then((bytes) => {
			return bytes;
		})
		.catch((err) => {
			console.error('error fetching federation for', env, err);
			return error(500, 'Error fetching federation');
		});
	if (!bytes) {
		return error(404, 'Federation not found');
	}

	// filename is federation_{env}_{yyyy-mm-dd-HH:MM:SS}_export.xlsx
	const now = new Date();
	const filename = `federation_${env}_${now.toISOString().replace(/:/g, '-').split('.')[0]}_export.xlsx`;

	return new Response(new Uint8Array(bytes), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
}
