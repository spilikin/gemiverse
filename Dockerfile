# syntax=docker/dockerfile:1.7

# ---- build stage ---------------------------------------------------------
# Match .nvmrc / package.json engines.node (Node 22 LTS). Alpine keeps the
# build image lean; the final runtime image uses alpine too.
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies first for better layer caching. `--ignore-scripts`
# skips the `prepare: svelte-kit sync` hook here — it needs svelte.config.js
# which we haven't copied yet. The sync runs naturally during `npm run build`.
# `--legacy-peer-deps` matches local install behavior (vite-plugin-svelte 7's
# peer-dep tree requires it).
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# Now bring in the source and produce the adapter-node bundle in /app/build.
COPY . .
RUN npm run build

# ---- runtime stage -------------------------------------------------------
# adapter-node emits a self-contained ./build that still imports
# @sveltejs/kit at runtime (kit is in devDependencies but shipped runtime
# helpers live there), so we keep the full node_modules from the build
# stage. package.json is needed for the "type": "module" resolution.
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/build        ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

EXPOSE 3000
CMD ["node", "build/index.js"]
