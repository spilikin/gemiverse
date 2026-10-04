import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import type { Certificates, TrustUrls, TslView } from '$ti-wasm/types';

/**
 * The vendored ti-wasm module (zero-lab `just wasm-vendor`), run in a worker thread: a
 * verification takes a few hundred milliseconds that would otherwise block the event
 * loop, and the module aborts on a panic (a trap), after which its instance cannot be
 * trusted. A trap ends the worker; the next call starts a fresh one.
 */
const WASM_DIR = process.env.TI_WASM_DIR ?? resolve('vendor/ti-wasm');
const CALL_TIMEOUT_MS = 30_000;

export type WasmVersion = {
	ti_wasm: string;
	commit: string;
	dirty: boolean;
	wasm_sha256: string;
};

let version: WasmVersion | null = null;

/** VERSION.json of the vendored build; its wasm_sha256 identifies the module in cache keys. */
export function wasmVersion(): WasmVersion {
	version ??= JSON.parse(readFileSync(resolve(WASM_DIR, 'VERSION.json'), 'utf8')) as WasmVersion;
	return version;
}

/** A wrong call (unknown environment, bad time, no certificate), never a verdict. */
export class WasmCallError extends Error {}

// CommonJS, as eval workers are; the glue is an ES module, hence the dynamic import.
const WORKER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads');
const { readFileSync } = require('node:fs');
import(workerData.glue).then((wasm) => {
	wasm.initSync({ module: readFileSync(workerData.module) });
	parentPort.on('message', ({ id, fn, args }) => {
		try {
			parentPort.postMessage({ id, ok: true, value: wasm[fn](...args) });
		} catch (e) {
			const trap = e instanceof WebAssembly.RuntimeError;
			parentPort.postMessage({ id, ok: false, trap, message: String(e && e.message || e) });
			if (trap) process.exit(1);
		}
	});
	parentPort.postMessage({ ready: true });
});
`;

type Pending = {
	resolve: (value: string) => void;
	reject: (err: Error) => void;
	timer: NodeJS.Timeout;
};

type Reply =
	| { ready: true }
	| { id: number; ok: true; value: string }
	| { id: number; ok: false; trap: boolean; message: string };

let worker: Worker | null = null;
let ready: Promise<Worker> | null = null;
let nextID = 0;
const pending = new Map<number, Pending>();

function failAll(err: Error) {
	for (const [id, call] of pending) {
		clearTimeout(call.timer);
		call.reject(err);
		pending.delete(id);
	}
}

function start(): Promise<Worker> {
	ready ??= new Promise<Worker>((resolveReady, rejectReady) => {
		const w = new Worker(WORKER_SOURCE, {
			eval: true,
			workerData: {
				glue: pathToFileURL(resolve(WASM_DIR, 'ti_wasm.js')).href,
				module: resolve(WASM_DIR, 'ti_wasm_bg.wasm')
			}
		});
		w.on('message', (reply: Reply) => {
			if ('ready' in reply) {
				worker = w;
				resolveReady(w);
				return;
			}
			const call = pending.get(reply.id);
			if (!call) return;
			pending.delete(reply.id);
			clearTimeout(call.timer);
			if (reply.ok) {
				call.resolve(reply.value);
			} else if (reply.trap) {
				call.reject(new Error(`ti-wasm trapped: ${reply.message}`));
			} else {
				call.reject(new WasmCallError(reply.message));
			}
		});
		const reset = (err: Error) => {
			if (worker === w || !worker) {
				worker = null;
				ready = null;
			}
			rejectReady(err);
			failAll(err);
		};
		w.on('error', (err) => reset(err));
		w.on('exit', (code) => reset(new Error(`ti-wasm worker exited with code ${code}`)));
	});
	return ready;
}

async function call(fn: string, ...args: unknown[]): Promise<string> {
	const w = await start();
	const id = nextID++;
	return new Promise<string>((resolveCall, rejectCall) => {
		const timer = setTimeout(() => {
			pending.delete(id);
			rejectCall(new Error(`ti-wasm ${fn} timed out after ${CALL_TIMEOUT_MS} ms`));
			// A stuck module is as untrustworthy as a trapped one.
			void w.terminate();
		}, CALL_TIMEOUT_MS);
		pending.set(id, { resolve: resolveCall, reject: rejectCall, timer });
		w.postMessage({ id, fn, args });
	});
}

export async function trustUrls(env: string): Promise<TrustUrls> {
	return JSON.parse(await call('trust_urls', env)) as TrustUrls;
}

/**
 * The TSL view of `xml` verified for `env` at `now`: roots.json bytes if available
 * (embedded roots otherwise), `graceSeconds` past NextUpdate tolerated.
 */
export async function verifyTsl(
	xml: Uint8Array,
	env: string,
	now: Date,
	rootsJson: Uint8Array | undefined,
	graceSeconds: number
): Promise<TslView> {
	const json = await call('verify_tsl', xml, env, now.toISOString(), rootsJson, graceSeconds);
	return JSON.parse(json) as TslView;
}

/** Every certificate in `input` (DER or PEM) as `ti pki inspect` describes it. */
export async function describeCertificate(input: Uint8Array, now: Date): Promise<Certificates> {
	return JSON.parse(await call('describe_certificate', input, now.toISOString())) as Certificates;
}
