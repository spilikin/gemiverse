# gematik Universe: Display Information about gematik public APIs

## Develop

Start Redis:

```bash
docker compose -f docker-compose-dev.yaml up -d
```

Start development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## TSL verification (ti-wasm)

The TSL screens (`/tsl/{env}/services`, `/services/{id}`, `/signature`, `/scheme`) and their REST
resources at the same paths under `/api/tsl` (plus `/api/tsl/{env}/xml`) verify the TSL with the ti-wasm module in `vendor/ti-wasm`: signature, signer, roots and the chain
of every service certificate. The module is built in
[zero-lab](https://github.com/gematik/zero-lab/tree/main/rust/ti-wasm) and committed here; do not
edit it, update it from a zero-lab checkout next to this one:

```bash
just wasm-vendor   # in zero-lab/rust
```

`vendor/ti-wasm/VERSION.json` names the commit it was built from. The server loads the module at
run time from `vendor/ti-wasm` (`TI_WASM_DIR` to override) in a worker thread.

## Build and deploy

To create a production version of your app:

```bash
just dockerpush
just deploy
```
