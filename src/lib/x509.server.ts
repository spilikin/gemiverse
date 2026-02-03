import crypto from 'crypto'
import type { CertificateInfo } from './x509';

export type { CertificateInfo };

export function parseCertificateFromBase64(b64: string): crypto.X509Certificate {
    return new crypto.X509Certificate(`-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----`)
}

export function encodeCertificateToPEM(x509: crypto.X509Certificate): string {
    const base64encoded = x509.raw.toString('base64').replace(/(.{64})/g, "$1\n");
    return `-----BEGIN CERTIFICATE-----\n${base64encoded}\n-----END CERTIFICATE-----`
}

export function toCertificateInfo(x509: crypto.X509Certificate): CertificateInfo {
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
