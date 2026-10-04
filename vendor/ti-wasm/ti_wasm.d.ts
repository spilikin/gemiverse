/* tslint:disable */
/* eslint-disable */

/**
 * One environment's TSL and roots, verified once, to check any number of certificates
 * against (`schemas/check.json`). An invalid list is not an error: every check against
 * it reports it.
 */
export class TrustContext {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * The report on `input` (PEM with the end entity first and any intermediates after
     * it, or one DER certificate) at `now` (RFC 3339).
     *
     * # Errors
     *
     * A bad time, or no certificate in `input`.
     */
    check(input: Uint8Array, now: string): string;
    /**
     * Verifies `xml` as the TSL of `env` at `now` (RFC 3339), with `roots_json` as
     * fresher roots if given and `grace_seconds` past `NextUpdate` tolerated.
     *
     * # Errors
     *
     * An unknown environment, a bad time or a grace period over 30 days.
     */
    constructor(xml: Uint8Array, env: string, now: string, roots_json: Uint8Array | null | undefined, grace_seconds: number);
    /**
     * The state of the trust material: `{"result","error","sequence_number",…}`.
     */
    tsl(): string;
}

/**
 * `{"schema","certificates":[…]}`: every certificate in `input` (DER or PEM) as `ti pki
 * inspect` describes it at `now` (RFC 3339).
 *
 * # Errors
 *
 * A bad time, or no certificate in `input`.
 */
export function describe_certificate(input: Uint8Array, now: string): string;

/**
 * `{"environment","tsl_url","roots_url"}` for `env` (`prod`, `ref`, `test`, `dev`).
 *
 * # Errors
 *
 * An unknown environment.
 */
export function trust_urls(env: string): string;

/**
 * The TSL view (`schemas/tsl-view.json`) of `xml` verified for `env` at `now` (RFC
 * 3339), with `roots_json` as fresher roots if given and `grace_seconds` past
 * `NextUpdate` tolerated.
 *
 * # Errors
 *
 * An unknown environment, a bad time or a grace period over 30 days.
 */
export function verify_tsl(xml: Uint8Array, env: string, now: string, roots_json: Uint8Array | null | undefined, grace_seconds: number): string;

/**
 * `{"ti_wasm","schema"}`.
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_trustcontext_free: (a: number, b: number) => void;
    readonly describe_certificate: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly trust_urls: (a: number, b: number, c: number) => void;
    readonly trustcontext_check: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly trustcontext_new: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
    readonly trustcontext_tsl: (a: number, b: number) => void;
    readonly verify_tsl: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => void;
    readonly version: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
