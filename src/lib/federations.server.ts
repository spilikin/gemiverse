import Atlas from './atlas'
import * as jose from 'jose'
import { encodeEntityIdentifier, EntityType, type Entity, type EntityStatement, type Federation, type CertificateInfo, type AndroidAppAsset, type AppleAppLink, type AndroidApp } from './federations'
import { httpInitForURL } from './api_key.server'
import { loadObjectFromCache } from '$lib/cache.server'
import crypto from "crypto"
import axios from 'axios';


const CONTROLLER_URL = process.env.CONTROLLER_URL || 'http://localhost:3001'

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
        return fetchEntityBase(entity)
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
async function fetchEntityBase(iss: string): Promise<Entity> {
  const statement = await fetchEntityStatement(iss)
  return {
    id: encodeEntityIdentifier(statement),
    type: statement.metadata.openid_provider ? EntityType.OpenidProvider : EntityType.OpenidRelyingParty,
    iss: iss,
    statement: statement,
  }
}

async function fetchEntity(iss: string) {
    const entity = await fetchEntityBase(iss)
    var jwks: jose.JSONWebKeySet | undefined = undefined
    const hostnames = new Set<string>()
    if (entity.statement?.metadata.openid_provider) {
        const m = entity.statement.metadata.openid_provider
        jwks = m.jwks
        if (m.signed_jwks_uri) {
            jwks = await fetch(m.signed_jwks_uri)
                .then(res => res.text())
                .then(token => jose.decodeJwt(token))
        }
        for (const url of [m.issuer, m.authorization_endpoint, m.token_endpoint, m.pushed_authorization_request_endpoint]) {
            hostnames.add(new URL(url).hostname)
        }
    } else if (entity.statement?.metadata.openid_relying_party) {
        const m = entity.statement.metadata.openid_relying_party
        jwks = m.jwks
        if (m.signed_jwks_uri) {
            jwks = await fetch(m.signed_jwks_uri)
                .then(res => res.text())
                .then(token => jose.decodeJwt(token))
        }
        // uris array consists of:
        // - all redirect_uris
        // - issuer of entity statement
        // - if available - signed_jwks_uri
        const uris = m.redirect_uris.concat([entity.statement.iss])
        if (m.signed_jwks_uri) {
            uris.push(m.signed_jwks_uri)
        }
        for (const url of uris) {
            hostnames.add(new URL(url).hostname)
        }

    }

    var jwksCertificates = new Array<CertificateInfo[]>()
    for (const key of jwks?.keys || []) {
        if (key.x5c) {
          try {
            const certs = new Array<CertificateInfo>()
            for (const base64cert of key.x5c) {
                const x509 = new crypto.X509Certificate(`-----BEGIN CERTIFICATE-----\n${base64cert}\n-----END CERTIFICATE-----`)
                certs.push(toCertificateInfo(x509))
            }
            jwksCertificates.push(certs)
          } catch (err) {
              console.error('error parsing x5c', err, key.x5c)
          }
        } else {
          jwksCertificates.push([])
        }

    }

    
    entity.jwks = jwks
    entity.jwksCertificates = jwksCertificates
    entity.hosts = Array.from(hostnames)
        .sort()
        .filter(name => !isLocalhost(name))
        .map(name => { return {name: name} })

    entity.hosts = await Promise.all(entity.hosts.map(async host => {
        host.certificates = await getHostCertificates(host.name).then(certs => certs.map(cert => toCertificateInfo(cert)))
        return host
    }))

    let androidLinks = await fetchAndroidLinks(entity.statement!)
    entity.androidLinks = Array.from(new Set(androidLinks.map(link => JSON.stringify(link)))).map(link => JSON.parse(link))
    let appleLinks = await fetchAppleAppLinks(entity.statement!)
    entity.appleLinks = Array.from(new Set(appleLinks.map(link => JSON.stringify(link)))).map(link => JSON.parse(link))
    return entity
}

async function getHostCertificates(hostname: string): Promise<crypto.X509Certificate[]> {
    const url = `${CONTROLLER_URL}/cert.cgi?hostname=${hostname}`

    let text = await loadObjectFromCache<string>(url, false, async () => {
        return fetch(url).then(res => res.text())
    }, 60).catch(err => {
        console.error('error fetching', url, err)
        return ''
    })

    // split PEM-encoded certificates
    const certs = text!.split(/-----BEGIN CERTIFICATE-----\n/)
    // remove empty string
    certs.shift()
    // add BEGIN CERTIFICATE back
    certs.forEach((cert, i) => {
      certs[i] = `-----BEGIN CERTIFICATE-----\n${cert}`
    })
    return certs.map(cert => new crypto.X509Certificate(cert))
}

function toCertificateInfo(x509: crypto.X509Certificate): CertificateInfo {
    var keyAlg
    if (x509.publicKey.asymmetricKeyType == 'ec') {
      keyAlg = x509.publicKey.asymmetricKeyDetails?.namedCurve
    } else {
      keyAlg = "RSA-"+x509.publicKey.asymmetricKeyDetails?.modulusLength
    }
    return {
        subject: x509.subject,
        issuer: x509.issuer,
        serialNumber: x509.serialNumber,
        keyType: x509.publicKey.asymmetricKeyType?.toUpperCase(),
        keyAlg: keyAlg,
        notBefore: new Date(x509.validFrom),
        notAfter: new Date(x509.validTo),
    }
}

function fetchEntityStatement(iss: string) {
    const init = httpInitForURL(iss)
    const wellknownURL = `${iss}/.well-known/openid-federation`
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

function isLocalhost(hostname: string) {
  if (hostname == 'localhost' || hostname == '127.0.0.1') {
      return true
  }
  return false
}

function getAppBaseUrls(statement: EntityStatement): string[] {
  var result = new Set<string>()
  if (statement.metadata.openid_relying_party) {
    for (const uri of statement.metadata.openid_relying_party.redirect_uris) {
      result.add(new URL(uri).origin)
    }
  }
  if (statement.metadata.openid_provider) {
    result.add(new URL(statement.metadata.openid_provider.pushed_authorization_request_endpoint).origin)
    result.add(new URL(statement.metadata.openid_provider.authorization_endpoint).origin)
    result.add(new URL(statement.metadata.openid_provider.token_endpoint).origin)
  }
  return Array.from(result).filter(url => url != null && url != '' && url != 'null')
}

async function fetchAndroidLinks(stmt: EntityStatement): Promise<AndroidAppAsset[]> {
  var urls = getAppBaseUrls(stmt)

  const promises = urls.map(url => {
    url += '/.well-known/assetlinks.json'
    return loadObjectFromCache<string>(url, false, async () => {
      return axios.get(url, {insecureHTTPParser: true}).then(res => JSON.stringify(res.data))
    }, 60)
    .then(json => {
      let obj = JSON.parse(json!)
      if (obj instanceof Array) {
        return obj.map((asset: any) => {
          return {
            namespace: asset['namespace'],
            relation: asset['relation'],
            target: {
              namespace: asset['target']['namespace'],
              package_name: asset['target']['package_name'],
              sha256_cert_fingerprints: asset['target']['sha256_cert_fingerprints']
            } as AndroidApp
          } as AndroidAppAsset
        })
      } else {
        return [] as AndroidAppAsset[]
      }
    })
    .catch(err => {
      console.error('error fetching', url, err.message)
      return [] as AndroidAppAsset[]
    })

    })

    return (await Promise.all(promises)).flat()
}

async function fetchAppleAppLinks(stmt: EntityStatement): Promise<AppleAppLink[]> {
  var urls = getAppBaseUrls(stmt)

  const promises = urls.map(url => {
    url += '/.well-known/apple-app-site-association'
    return loadObjectFromCache<string>(url, false, async () => {
      return axios.get(url, {insecureHTTPParser: true}).then(res => JSON.stringify(res.data))
    }, 60)
    .then(json => JSON.parse(json!)['applinks']['details'])
    .catch(err => {
      console.error('error fetching', url, err.message)
      return [] as AppleAppLink[]
    })

    })

    return (await Promise.all(promises)).flat()
}

export async function prefetchFederationCache() {
    var promises = []
    for (const env of ['test', 'ref', 'prod']) {
        promises.push(getFederation(env, true))
    }
    await Promise.all(promises)
}
