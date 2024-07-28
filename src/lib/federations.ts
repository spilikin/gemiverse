import Atlas from './atlas'
import * as jose from 'jose'
import HttpCache from './cache'

export interface FederationEntity {
    federation_fetch_endpoint?: string
    federation_list_endpoint?: string
    idp_list_endpoint?: string
    homepage_uri?: string
    name?: string
    contacts?: Array<string>
}

export interface OpenidProvider {
    response_types_supported: string[]
    client_registration_types_supported: string[]
    pushed_authorization_request_endpoint: string
    logo_uri: string
    grant_types_supported: string[]
    //request_authentication_methods_supported: [Object],
    organization_name: string
    scopes_supported: string[]
    issuer: string
    id_token_encryption_enc_values_supported: string[]
    authorization_endpoint: string
    require_pushed_authorization_requests: boolean,
    id_token_encryption_alg_values_supported: string[]
    subject_types_supported: string[]
    signed_jwks_uri: string,
    id_token_signing_alg_values_supported: string[]
    token_endpoint_auth_methods_supported: string[]
    response_modes_supported: string[]
    user_type_supported: string[]
    token_endpoint: string
}

export interface OpenidRelyingParty {
    signed_jwks_uri?: string
    jwks?: jose.JSONWebKeySet
    client_name?: string
    organization_name?: string
    logo_uri?: string
    redirect_uris: string[]
    response_types: string[]
    client_registration_types: string[]
    grant_types: string[]
    require_pushed_authorization_requests: boolean
    token_endpoint_auth_method: string
    default_acr_values: string[]
    id_token_signed_response_alg: string
    id_token_encrypted_response_alg: string
    id_token_encrypted_response_enc: string
    scope: string
}

export interface Metadata {
    federation_entity?: FederationEntity
    openid_provider?: OpenidProvider
    openid_relying_party?: OpenidRelyingParty
}

export function entityIdentifier(statement: EntityStatement) {
    // remove https:// and http://, replace slashes with $
    return statement.iss.replace(/https?:\/\//, '').replaceAll(/\//g, '$')
}

interface Error {
    error: string
    error_description: string

}

export interface AndroidAppAsset {
    relation: string[]
    target: AndroidApp
}

export interface AndroidApp {
    namespace: string
    package_name: string
    sha256_cert_fingerprints: string[]
} 

export interface Entity {
    iss: string
    error?: Error
    statement?: EntityStatement
    androidLinks?: AndroidAppAsset[]
    appleLinks?: AppleAppLink[]
}

export interface EntityStatement {
    iss: string
    sub: string
    metadata: Metadata
    jwks?: jose.JSONWebKeySet
    error?: Error,
}

export interface Federation {
    master: EntityStatement,
    entities: Entity[]
}

var cache = new HttpCache()

export async function fetchFederation(env: string): Promise<Federation> {
    console.log('fetching federation', env)
    const iss = Atlas.fed[env as keyof typeof Atlas.fed].url
    const wellknownURL = `${iss}/.well-known/openid-federation`
    const jwt = await fetch(wellknownURL).then(res => res.text()).then(token =>  jose.decodeJwt(token))
    console.log('discovery', jwt)
    const statement = jwt as unknown as EntityStatement
    const list = await fetchFederationList(statement.metadata.federation_entity!.federation_list_endpoint!)
    var promises = list.map((entity) => {
        return fetchEntity(entity)
        .then(entity => entity)
        .catch(err => {
            console.error(entity, err)
            return {
                iss: entity,
                error: {
                    error: err.message,
                    error_description: ""
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

function redirectURIs(statement: EntityStatement): string[] {
  var result = Array<string>()
  if (statement.metadata.openid_relying_party) {
    result.push(...statement.metadata.openid_relying_party.redirect_uris)
  }
  return result
}

export async function fetchEntity(iss: string) {
    const statement = await fetchEntityStatement(iss)
    let androidLinks = await fetchAndroidLinks(statement)
    let distinctAndroidLinks = Array.from(new Set(androidLinks.map(link => JSON.stringify(link)))).map(link => JSON.parse(link))
    let appleLinks = await fetchAppleAppLinks(statement)
    let distinctAppleLinks = Array.from(new Set(appleLinks.map(link => JSON.stringify(link)))).map(link => JSON.parse(link))
    return {
        iss: iss,
        statement: statement,
        androidLinks: distinctAndroidLinks,
        appleLinks: distinctAppleLinks
        
    }
}


export interface AppleAppLink {
    appIDs: string[]
    components: Map<string, string>[]
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

export function fetchEntityStatement(iss: string) {
    const wellknownURL = `${iss}/.well-known/openid-federation`
    return cache.fetch(wellknownURL)
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

var federationCache = new Map<string, Federation>()

export function updateCache() {
    cache.clear()
    for (const env of ['test', 'ref', 'prod']) {
        fetchFederation(env).then(fed => {
            console.log('Updated cache', fed.master.iss)
            federationCache.set(env, fed)
        }).catch(err => {
            console.error('error fetching', env)
            console.error(err)
        })
    }
}

export function getFederation(env: string): Federation | undefined {
    console.log('get federation', env, 'from cache')
    return federationCache.get(env)
}