import Atlas from './atlas'
import * as jose from 'jose'
import HttpCache from './cache'

interface FederationEntity {
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

interface OpenidRelyingParty {
    logo_uri?: string
}

interface Metadata {
    federation_entity?: FederationEntity
    openid_provider?: OpenidProvider
    openid_relying_party?: OpenidRelyingParty
}

export function entityIdentifier(statement: EntityStatement) {
    // remove https:// and http://, replace slashes with $
    return statement.iss.replace(/https?:\/\//, '').replace(/\//g, '$')
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
    error?: Error
    statement?: EntityStatement
    androidLinks?: AndroidAppAsset[]
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

export async function fetchEntity(iss: string) {
    const statement = await fetchEntityStatement(iss)
    const androidLinks = await fetchAndroidLinks(iss)
    return {
        statement: statement,
        androidLinks: androidLinks
    }
}

export async function fetchAndroidLinks(iss: string): Promise<AndroidAppAsset[]> {
    // create base URL
    var wellknownURL = new URL(iss)
    wellknownURL.pathname = '/.well-known/assetlinks.json'
    console.log('fetching', wellknownURL.href)
    return cache.fetch(wellknownURL.href).then(res => res.json())
        .then((json) => {
            console.log('fetched:', json as AndroidAppAsset[])
            return json as AndroidAppAsset[]
        })
        .catch(err => {
            console.error('error fetching', wellknownURL.href)
            //console.error(err)
            return []
        })
}

export function fetchEntityStatement(iss: string) {
    const wellknownURL = `${iss}/.well-known/openid-federation`
    return cache.fetch(wellknownURL).then(res => res.text())
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