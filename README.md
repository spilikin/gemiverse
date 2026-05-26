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

## Build and deploy

To create a production version of your app:

```bash
just dockerpush
just deploy
```
