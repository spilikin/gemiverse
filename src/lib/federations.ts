import * as jose from 'jose'

export function encodeEntityIdentifier(statement: EntityStatement) {
    // remove https://, replace slashes with $
    return statement.iss.replace(/https:\/\//, '').replaceAll(/\//g, '$')
}

export function decodeEntityIdentifier(entityId: string) {
    return "https://"+entityId.replaceAll('$', '/')
}

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
    signed_jwks_uri?: string,
    jwks?: jose.JSONWebKeySet,
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

export interface AppleAppLink {
    appID?: string
    appIDs?: string[]
    components: Map<string, string>[]
}

export interface HostInfo {
  name: string
  certificates?: CertificateInfo[]
}

// enumeration for entity type (openid_provider, openid_relying_party)
export enum EntityType {
    OpenidProvider = "openid_provider",
    OpenidRelyingParty = "openid_relying_party"
}
export interface Entity {
    id: string
    type: EntityType
    iss: string
    error?: Error
    statement?: EntityStatement
    androidLinks?: AndroidAppAsset[]
    appleLinks?: AppleAppLink[]
    jwks?: jose.JSONWebKeySet
    jwksCertificates?: Array<CertificateInfo[]>
    hosts?: HostInfo[]
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

export interface CertificateInfo {
    subject: string
    issuer: string
    serialNumber: string
    keyType?: string
    keyAlg?: string
    notBefore: Date
    notAfter: Date
}

export function parseDistinguishedName(dn: string): Map<string, string[]> {
    // Replace the pattern with a delimiter
    let replacedStr = dn.replace(/([a-zA-Z]+)=/g, '|$1|');

    // Split the string using the delimiter
    let parts = replacedStr.split('|').map(s => s.trim());

    if (parts[0] === '') {
        parts.shift()
    }

    // Create a map of the key value pairs
    let result = new Map<string, string[]>();

    for (let i = 0; i < parts.length; i += 2) {
        let key = parts[i];
        let value = parts[i + 1];
        if (result.has(key)) {
            result.get(key)?.push(value)
        } else {
            result.set(key, [value])
        }
    }

    return result
}