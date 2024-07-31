import Atlas from './atlas'
import * as jose from 'jose'
import type { Entity, EntityStatement, Federation, X509Certificate } from './federations'
import { httpInitForURL } from './api_key.server'
import { loadObjectFromCache } from '$lib/cache.server'
import crypto from "crypto"
import https from "https"
import type { TLSSocket } from 'tls'

export async function getFederation(env: string, forceFetch: boolean = false): Promise<Federation | null> {
    const key = `federations:${env}`

    return await loadObjectFromCache<Federation>(key, forceFetch, async () => {
        return await fetchFederation(env)
    })
}

export async function getEntity(env: string, iss: string, forceFetch: boolean = false): Promise<Entity | null> {
    const key = `federations:${env}:entity:${iss}`

    return await loadObjectFromCache<Entity>(key, forceFetch, async () => {
        return await fetchEntity(iss)
    })
}

async function fetchFederation(env: string): Promise<Federation | null> {
    if (!Atlas.federations[env as keyof typeof Atlas.federations]) {
        return null
    }
    const iss = Atlas.federations[env as keyof typeof Atlas.federations].url
    const wellknownURL = `${iss}/.well-known/openid-federation`
    console.log('fetching federation', wellknownURL)
    const jwt = await fetch(wellknownURL).then(res => res.text()).then(token =>  jose.decodeJwt(token))
    const statement = jwt as unknown as EntityStatement

    const list = await fetchFederationList(statement.metadata.federation_entity!.federation_list_endpoint!)

    var promises = list.map((entity) => {
        return fetchEntity(entity)
        .then(entity => entity)
        .catch(err => {
            console.error(entity, err.message)
            return {
                iss: entity,
                error: {
                    error: typeof err,
                    error_description: err.message
                }
            } as Entity
        })
    })
    const entities = await Promise.all(promises)
    return {
        master: statement,
        entities: entities
    }
}

async function fetchEntity(iss: string) {
    const statement = await fetchEntityStatement(iss)
    if (statement.metadata.openid_provider) {
        var jwks = statement.metadata.openid_provider.jwks
        if (statement.metadata.openid_provider.signed_jwks_uri) {
            jwks = await fetch(statement.metadata.openid_provider.signed_jwks_uri)
                .then(res => res.text())
                .then(token => jose.decodeJwt(token))
        }
        
        var certs = new Array<X509Certificate | null>()
        for (const key of jwks?.keys || []) {
            if (key.x5c) {
                try {
                    const x509 = new crypto.X509Certificate(`-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`)
                    
                    certs.push({
                        subject: x509.subject,
                        issuer: x509.issuer,
                        serialNumber: x509.serialNumber,
                        keyType: x509.publicKey.asymmetricKeyType?.toUpperCase(),
                        namedCurve: x509.publicKey.asymmetricKeyDetails?.namedCurve,
                        notBefore: new Date(x509.validFrom),
                        notAfter: new Date(x509.validTo)
                    })
                } catch (err) {
                    console.error('error parsing x5c', err, key.x5c)
                }
            } else {
                certs.push(null)
            }

        }

        statement.metadata.openid_provider.extra = {
            jwks: jwks,
            certificates: certs
        }

    }
    //let androidLinks = await fetchAndroidLinks(statement)
    //let distinctAndroidLinks = Array.from(new Set(androidLinks.map(link => JSON.stringify(link)))).map(link => JSON.parse(link))
    //let appleLinks = await fetchAppleAppLinks(statement)
    //let distinctAppleLinks = Array.from(new Set(appleLinks.map(link => JSON.stringify(link)))).map(link => JSON.parse(link))
    return {
        iss: iss,
        statement: statement,
        //androidLinks: distinctAndroidLinks,
        //appleLinks: distinctAppleLinks
        
    }
}

function fetchEntityStatement(iss: string) {
    const init = httpInitForURL(iss)
    const wellknownURL = `${iss}/.well-known/openid-federation`
    console.log('fetching entity statement', wellknownURL)
    return fetch(wellknownURL, init)
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP Error ${res.status} ${res.statusText}`)
          }
          return res.text()
        })
        .then(token => {
            return jose.decodeJwt(token)
        })
        .then(jwt => {
            return jwt as unknown as EntityStatement
        })
        

}

function fetchFederationList(endpoint: string): Promise<Array<string>> {
    return fetch(endpoint).then(res => res.json())
}


/*
function redirectURIs(statement: EntityStatement): string[] {
    var result = Array<string>()
    if (statement.metadata.openid_relying_party) {
      result.push(...statement.metadata.openid_relying_party.redirect_uris)
    }
    return result
  }
  


// parse string to URL
function isLocalhost(url: URL) {
    if (url.hostname == 'localhost' || url.hostname == '127.0.0.1') {
        return true
    }
    return false
}

export async function fetchAppleAppLinks(stmt: EntityStatement) {
  var uris = redirectURIs(stmt)
  uris.push(stmt.iss)


  const promises = uris.map(url => {
    // create base URL
    var wellknownURL = new URL(url)
    if (isLocalhost(wellknownURL)) {
        return [] as AppleAppLink[]
    }
    wellknownURL.pathname = '/.well-known/apple-app-site-association'
    console.log('fetching', wellknownURL.href)
    return cache.fetch(wellknownURL.href).
      then(res => {
          if (!res.ok) {
            throw new Error(`HTTP Error ${res.status} ${res.statusText}`)
          }
          return res.json()
      })
      .then(json => json['applinks']['details'] as AppleAppLink)
      .catch(err => {
        console.error('error fetching', wellknownURL.href)
        //console.error(err)
        return [] as AppleAppLink[]
      })
    })

    return (await Promise.all(promises)).flat()
}

export async function fetchAndroidLinks(stmt: EntityStatement): Promise<AndroidAppAsset[]> {
  var uris = redirectURIs(stmt)
  uris.push(stmt.iss)

  const promises = uris.map(url => {
    // create base URL
    console.log('Android fetch', url)
    var wellknownURL = new URL(url)
    if (isLocalhost(wellknownURL)) {
        return [] as AndroidAppAsset[]
    }
    wellknownURL.pathname = '/.well-known/assetlinks.json'
    console.log('fetching', wellknownURL.href)
    return cache.fetch(wellknownURL.href)
        .then(res => {
          if (!res.ok) {
              throw new Error(`HTTP Error ${res.status} ${res.statusText}`)
          }
          return res.json()
        })
        .then(json => json as AndroidAppAsset[])
        .catch(err => {
            console.error('error fetching', wellknownURL.href)
            //console.error(err)
            return [] as AndroidAppAsset[]
        })
    })

    return (await Promise.all(promises)).flat()
}


var federationCache = new Map<string, Federation>()

    */

/*
export function getFederation(env: string): Federation | undefined {
    console.log('get federation', env, 'from cache')
    return federationCache.get(env)
}
*/

export async function prefetchFederationCache() {
    var promises = []
    for (const env of ['test', 'ref', 'prod']) {
        promises.push(getFederation(env, true))
    }
    await Promise.all(promises)
}
