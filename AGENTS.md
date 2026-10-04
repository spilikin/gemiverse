# Agent guide: gemiverse

SvelteKit 2 / Svelte 5 (runes) app with Carbon Components, adapter-node in a Node 22 container,
Valkey as cache. It shows public gematik data: OpenID federations, the TI trust service lists
(TSL) and the service catalog.

```bash
docker compose -f docker-compose-dev.yaml up -d cache   # Valkey on :6379
npm ci --legacy-peer-deps
npm run dev
npm run check      # svelte-check, must report 0 errors
npx eslint .       # must be clean
npx vitest run
```

`npm run lint` also runs `prettier --check .`, which currently fails on `src/lib/catalog/abrik.json`
and `src/lib/version.ts` (unformatted on `main`, generated). Do not reformat them as a side effect
of other work: run Prettier on the files you touched, not `--write .`.

## TSL: verified by ti-wasm

The TSL screens never parse or trust the XML themselves. The list is verified by **ti-wasm**, the
TI PKI of zero-lab (Rust) compiled to WebAssembly and vendored in `vendor/ti-wasm`:

- the XMLDSig signature and the C.TSL.SIG signer under the environment's TSL signer CA
  (GEM.TSL-CA3 for prod, GEM.TSL-CA28 TEST-ONLY for test/ref), `NextUpdate` with a grace period;
- the trusted roots walked from the environment's anchor through roots.json (cross-certificates);
- every CA of the list against those roots, and the chain of every service certificate.

The module is pure: no network, no clock. The server downloads the TSL and roots.json, passes the
bytes and the current time, and gets JSON back. A verdict, including an invalid list, is always
in the JSON; a thrown error means a wrong call (unknown environment, bad time, grace period over
30 days, not a certificate).

### Layers

| Layer        | File                                 | Does                                                                                                         |
| ------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Module       | `vendor/ti-wasm/`                    | generated; `ti_wasm.js` glue, `ti_wasm_bg.wasm`, `types.d.ts`, JSON schemas, `VERSION.json`                  |
| Runtime      | `src/lib/ti/ti_wasm.server.ts`       | runs the module in a `worker_threads` worker: `verifyTsl`, `describeCertificate`, `trustUrls`, `wasmVersion` |
| Verification | `src/lib/tsl/tsl_verified.server.ts` | downloads TSL + roots.json through Valkey, verifies, memoizes the view: `getVerifiedTsl(env)`                |
| Resources    | `src/lib/tsl/tsl_api.server.ts`      | turns the view into the REST resources; `loadTsl(env)` maps failures to 404/502/500                          |
| Types        | `src/lib/tsl/tsl_api.ts`             | the REST resource types, shared by endpoints and screens                                                     |
| REST         | `src/routes/api/tsl/**/+server.ts`   | thin: `loadTsl` + one builder + `json()`                                                                     |
| Screens      | `src/routes/tsl/**`                  | load the REST resource of the same path (`getResource` in `src/lib/tsl/tsl_fetch.ts`)                        |

Rules:

- **Only the server touches the module.** Import from `ti_wasm.server.ts`; never import
  `vendor/ti-wasm/ti_wasm.js` into a component or a universal `+page.ts`. Type-only imports from
  `$ti-wasm/types` (alias in `svelte.config.js`) are fine anywhere.
- **The worker is deliberate.** A verification takes ~250 ms (it would block the event loop), and
  the module aborts on a Rust panic (a WebAssembly trap), after which its instance is unusable. The
  worker dies on a trap and the next call starts a fresh one; a call times out after 30 s.
  Calls are serialized in the worker; do not create further instances.
- **Pass bytes, not text.** The signature covers the exact bytes. Downloads go through
  `fetchBytesConditional` (`src/lib/http_cache.server.ts`), which stores base64 in Valkey;
  `response.text()` would drop a BOM or replace invalid sequences and can break verification.
- **Do not cache the view in Valkey.** It depends on the time (validity, overdue) and is large;
  `getVerifiedTsl` keeps it in memory for 10 minutes per (TSL sha256, roots sha256, wasm sha256)
  and shares one run between concurrent callers. The XML and roots.json are what Valkey caches
  (`tsl:xml:{env}`, `roots:{env}`, 30 min, ETag/Last-Modified).
- **Grace period** for the web view: 7 days past `NextUpdate` (`GRACE_SECONDS`); beyond it the
  list is invalid (`validity_warning_2`). The module refuses more than 30 days.
- **A failed roots.json download is not fatal**: the module falls back to its embedded roots and
  says so (`roots.source: "embedded"`). Supplied roots are only used if they walk from the anchor,
  so they can never add trust. A failed TSL download without a cached copy is a 502.
- Fingerprints (`{id}` of a service) are the lower-case SHA-256 hex of the certificate's DER;
  validate with `/^[0-9a-f]{64}$/` before use.

### The view (module output)

`verifyTsl` returns a `TslView` (`vendor/ti-wasm/types.d.ts`, schema `tsl-view.json`):
`result`/`error`, `tier`, `signature` (signer, TSL signer CA, warnings), `list` (sequence number,
dates, scheme), `roots` (trusted roots and the CAs each signed), `counts`, `providers[].services[]`
(type, status, type OIDs with gemSpec_OID names, certificate fingerprint, `chain` with `path` from
the certificate up and `trusted`/`rejection`) and `certificates` (fingerprint → full
certificate details as `ti pki inspect` shows them). Screens do not get the view; they get the
resources built from it.

## Screens, tabs, breadcrumb and REST share one path

Every TSL screen has a REST resource at the same path under `/api`, its tab is the path segment,
and the breadcrumb follows the path. Keep it that way when adding anything.

| Breadcrumb                | Screen                                 | REST                                                   |
| ------------------------- | -------------------------------------- | ------------------------------------------------------ |
| Trusted Lists             | `/tsl`                                 | `/api/tsl`                                             |
| Trusted Lists › Produktiv | `/tsl/{env}` → redirects to `services` | `/api/tsl/{env}` (summary, header of every TSL screen) |
| … › Services              | `/tsl/{env}/services`                  | `/api/tsl/{env}/services`                              |
| … › Services › {name}     | `/tsl/{env}/services/{id}`             | `/api/tsl/{env}/services/{id}`                         |
| … › Signature             | `/tsl/{env}/signature`                 | `/api/tsl/{env}/signature`                             |
| … › Scheme                | `/tsl/{env}/scheme`                    | `/api/tsl/{env}/scheme`                                |
| –                         | link on the Signature tab              | `/api/tsl/{env}/xml` (the bytes as verified)           |

`src/routes/tsl/[env]/+layout.svelte` renders breadcrumb, header line and tabs for all of them;
a detail page adds its last breadcrumb item by returning `title` from its `load`.

To add a tab: add the builder to `tsl_api.server.ts` and the type to `tsl_api.ts`, the endpoint
`src/routes/api/tsl/[env]/{tab}/+server.ts`, the screen `src/routes/tsl/[env]/{tab}/` with a
`+page.ts` that calls `getResource`, and an entry in the layout's `tabs`.

`/api/tsl/{env}/qes` (BNetzA list) still uses the old JSDOM parser in `src/lib/tsl/tsl.server.ts`;
it is not part of the verified screens.

## UI rules

- **The service is the main element** of a TSL, not the provider: one flat, searchable table
  with the provider as a column.
- **Plain text over tags.** Use red text (`var(--cds-support-error)`) for expired dates and
  untrusted chains; no tags for kind, key or status. Scope/type information goes into search,
  not into badges.
- **No extra sub-pages, modals or accordions** beyond the path map above.
- **Trust is shown with `TrustTree`** (`src/lib/components/TrustTree.svelte`) everywhere a chain
  appears: end entity first, each issuer indented below it, root last; ✓ valid and trusted, ⚠
  trusted but not valid now, ✗ not trusted. The REST resources deliver the nodes (`tree`) in that
  order; do not rebuild chains in the browser. A node that is a service of the list links to its
  page.
- Certificates are shown with `CertificateFieldsView`; names with `displayName` from
  `src/lib/x509.ts`, which handles multi-valued RDNs (`GN=…+SN=…+CN=…`, HBA) and RFC 4514 escapes.
  Do not split DNs on commas yourself.
- Internal links and `goto` go through `resolve()` from `$app/paths` (eslint enforces it).

## Updating ti-wasm

Never edit `vendor/ti-wasm` by hand. It is built in the zero-lab repository (checked out next to
this one) and copied here:

```bash
cd ../zero-lab/rust
just wasm-vendor            # build, Node smoke test, size budget, then rsync into ../../gemiverse/vendor/ti-wasm
```

`wasm-vendor` refuses a dirty zero-lab tree or a build without `wasm-opt` (binaryen).
`vendor/ti-wasm/VERSION.json` names the zero-lab commit, the tool versions and the module's
SHA-256; the Signature tab shows the version and commit that verified the list. After vendoring,
check `npm run check` (the generated types may have changed) and look at all three environments.

The Dockerfile copies `vendor/ti-wasm` into the runtime image; the server loads it from
`vendor/ti-wasm` relative to the working directory, or from `TI_WASM_DIR`.

## Checking a change

```bash
npm run dev
curl -s localhost:5173/api/tsl | jq '.environments[] | [.environment, .result, .sequence_number]'
curl -s localhost:5173/api/tsl/prod/services | jq '.services | length'
```

Then open `/tsl`, each environment, a service with a trusted chain, one with an expired link
(red ⚠) and one that is not trusted (e.g. an eGK OCSP responder under a self-signed CA), and the
Signature tab. Compare sequence numbers and CA counts with zero-lab's CLI when in doubt:
`ti pki tsl show --env prod`.
