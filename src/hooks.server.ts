import { updateCache } from "$lib/federations";

await updateCache();
setTimeout(updateCache, 5*60*1000);