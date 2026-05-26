let apiKeys: Map<string, string> | undefined = undefined;

export function httpInitForURL(url: string): RequestInit {
	let init = {};

	// parse string to URL and get host
	const host = new URL(url).host;

	if (!apiKeys) {
		const apiKeysString = process.env.API_KEYS;
		// parse apikeys: it's ";" separated and contains doman:apikey"
		// example: "example.com:123456;example2.com:654321"
		if (apiKeysString) {
			const apiKeysArray = apiKeysString.split(';');
			// create object with domain as key and apikey as value
			apiKeys = new Map(
				apiKeysArray.map((apiKey) => {
					const [domain, key] = apiKey.split(':');
					return [domain, key];
				})
			);
		}
	}

	// check if host is in apiKeys
	if (apiKeys && apiKeys.has(host)) {
		console.log('Using API key for ' + host);
		init = {
			headers: {
				'x-authorization': apiKeys.get(host)
			}
		};
	}

	return init;
}
