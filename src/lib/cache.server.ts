import Redis from 'ioredis';

// Create a new Redis instance with url from REDIST_URL environment variable
var _redis: Redis | null = null

function openRedis() {
  if (_redis) {
    return _redis
  }
  _redis = process.env.REDIS_HOST ? new Redis(6379, process.env.REDIS_HOST) : new Redis()
  return _redis
}

export async function loadObjectFromCache<T>(key: string, forceFetch: boolean, fetch: (() => Promise<T | null>), exp: number = undefined): Promise<T | null> {
    let redis = openRedis()
    let cache = async (obj: T) => {
        if (exp) {
            redis.set(key, JSON.stringify(obj), 'EX', exp)
        } else {
            redis.set(key, JSON.stringify(obj))
        }
    }
    if (forceFetch) {
        const fetched = await fetch()
        if (fetched) {
            await cache(fetched)
        }
        return fetched
    } else {
        const cached = await redis.get(key)
        if (cached) {
            return JSON.parse(cached)
        } else {
            const fetched = await fetch()
            if (fetched) {
                await cache(fetched)
            }
            return fetched
        }
    }
}