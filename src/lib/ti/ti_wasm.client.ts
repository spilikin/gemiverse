import init, { TrustContext } from '$ti-wasm/ti_wasm.js';
import wasmURL from '$ti-wasm/ti_wasm_bg.wasm?url';
import type { CheckReport, CheckTsl } from '$ti-wasm/types';

/**
 * ti-wasm in the browser, for checks that must not leave the page. Import this module
 * dynamically from the screen that needs it: the module is 1.3 MB and only fetched then.
 * The server side (`ti_wasm.server.ts`) is a separate instance in a worker thread.
 */

/** As on the server: a week past NextUpdate the list is still used, with a warning. */
const GRACE_SECONDS = 7 * 24 * 3600;

let ready: Promise<unknown> | null = null;

export type Checker = {
	tsl: CheckTsl;
	check: (certificate: Uint8Array) => CheckReport;
};

/**
 * Verifies the TSL and roots.json of `env` (bytes as served by `/api/tsl/{env}/xml` and
 * `/roots`; without roots the module's embedded ones) once, for any number of checks.
 *
 * @throws Error for a wrong call or bytes that are not a certificate; a verdict, including
 * an invalid TSL, is always in the result.
 */
export async function openChecker(
	env: string,
	xml: Uint8Array,
	roots: Uint8Array | undefined
): Promise<Checker> {
	ready ??= init({ module_or_path: wasmURL });
	await ready;
	const context = new TrustContext(xml, env, new Date().toISOString(), roots, GRACE_SECONDS);
	return {
		tsl: JSON.parse(context.tsl()) as CheckTsl,
		check: (certificate) =>
			JSON.parse(context.check(certificate, new Date().toISOString())) as CheckReport
	};
}
