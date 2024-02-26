// simple fetch wrapper wich caches the results

export default class HttpCache {
    cache: Map<string, Response> = new Map();

    async fetch(input: RequestInfo | URL, init?: RequestInit | undefined): Promise<Response> {
        if (typeof input === 'string') {
            if (this.cache.has(input)) {
                console.log('cache hit', input)
                return this.cache.get(input)?.clone() as Response;
            }
        }
        return fetch(input, init).then((response) => {
            this.cache.set(response.url, response.clone());
            return response;
        })
    }

    clear() {
        this.cache.clear();
    }
}
    
 