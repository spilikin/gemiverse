export function httpInitForURL(url: string): RequestInit {
    var init = {}

    // parse string to URL and get host
    const host = new URL(url).host

    // read api key from environment
    if (host.endsWith('.gematik.solutions')) {
        init = {
            headers: {
                'x-authorization': process.env.API_KEY
            }
        }
    }

    return init
}