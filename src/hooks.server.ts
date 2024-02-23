import { updateCache } from "$lib/federations";

// execute once on first run
await updateCache();

// execute every 5 minutes
setInterval(updateCache, 5 * 60 * 1000);