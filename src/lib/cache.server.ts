import Valkey from 'iovalkey';

// Create a new Redis instance with url from REDIST_URL environment variable
let _valkey: Valkey | null = null;

export function openValkey() {
	if (_valkey) {
		return _valkey;
	}
	_valkey = process.env.REDIS_HOST ? new Valkey(6379, process.env.REDIS_HOST) : new Valkey();
	return _valkey;
}

export async function loadObjectFromCache<T>(
	key: string,
	forceFetch: boolean,
	fetch: () => Promise<T | null>,
	exp: number | undefined = undefined
): Promise<T | null> {
	const valkey = openValkey();
	const cache = async (obj: T) => {
		if (exp) {
			valkey.set(key, JSON.stringify(obj), 'EX', exp);
		} else {
			valkey.set(key, JSON.stringify(obj));
		}
	};
	if (forceFetch) {
		const fetched = await fetch();
		if (fetched) {
			await cache(fetched);
		}
		return fetched;
	} else {
		const cached = await valkey.get(key);
		if (cached) {
			return JSON.parse(cached);
		} else {
			const fetched = await fetch();
			if (fetched) {
				await cache(fetched);
			}
			return fetched;
		}
	}
}

export async function saveHistoryIfChanged<T>(
	key: string,
	obj: T,
	maxHistoryEntries: number | undefined = undefined
) {
	const valkey = openValkey(); // Initialize valkey using openValkey

	if (maxHistoryEntries) {
		const latestHistory = await valkey.lindex(key + ':history', 0);
		const newHistoryEntry = JSON.stringify({
			timestamp: new Date().toISOString(),
			value: obj
		});

		if (!latestHistory || latestHistory !== newHistoryEntry) {
			await valkey.lpush(key + ':history', newHistoryEntry);
			await valkey.ltrim(key + ':history', 0, maxHistoryEntries - 1);
		}
	}
}
