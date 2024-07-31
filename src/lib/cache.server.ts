import Redis from 'ioredis';

// Create a new Redis instance with url from REDIST_URL environment variable
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : new Redis();

export async function loadObjectFromCache<T>(key: string, forceFetch: boolean, fetch: (() => Promise<T | null>)): Promise<T | null> {
    if (forceFetch) {
        const fetched = await fetch()
        if (fetched) {
            await redis.set(key, JSON.stringify(fetched))
        }
        return fetched
    } else {
        const cached = await redis.get(key)
        if (cached) {
            return JSON.parse(cached)
        } else {
            const fetched = await fetch()
            if (fetched) {
                await redis.set(key, JSON.stringify(fetched))
            }
            return fetched
        }
    }
}