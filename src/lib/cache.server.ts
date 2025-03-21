import Valkey from 'iovalkey';

// Create a new Redis instance with url from REDIST_URL environment variable
var _valkey: Valkey | null = null

function openValkey() {
  if (_valkey) {
    return _valkey
  }
  _valkey = process.env.REDIS_HOST ? new Valkey(6379, process.env.REDIS_HOST, {'return_buffers': true}) : new Valkey()
  return _valkey
}

export async function loadObjectFromCache<T>(key: string, forceFetch: boolean, fetch: (() => Promise<T | null>), exp: number | undefined = undefined): Promise<T | null> {
    let valkey = openValkey()
    let cache = async (obj: T) => {
        if (exp) {
            valkey.set(key, JSON.stringify(obj), 'EX', exp)
        } else {
            valkey.set(key, JSON.stringify(obj))
        }
    }
    if (forceFetch) {
        const fetched = await fetch()
        if (fetched) {
            await cache(fetched)
        }
        return fetched
    } else {
        const cached = await valkey.get(key)
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