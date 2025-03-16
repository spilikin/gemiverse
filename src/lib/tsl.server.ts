import { type ITrustServiceStatusList } from "./tsl"
import { loadObjectFromCache } from "./cache.server"
import { JSDOM } from 'jsdom'
import Atlas from './atlas'
import { toCertificateInfo, type CertificateInfo, parseCertificateFromBase64, encodeCertificateToPEM } from './x509'
import type { MultiLangString, MultiLangURI } from './tsl'
export type { MultiLangString, MultiLangURI }

export const NS_ETSI_02231_V2 = 'http://uri.etsi.org/02231/v2#';

export async function getTSL(env: string, forceFetch: boolean = false): Promise<ITrustServiceStatusList | null> {
    const key = `tsl:${env}`

    return await loadObjectFromCache<ITrustServiceStatusList>(key, forceFetch, async () => {
        return await fetchTSL(env)
    }, 30 * 60)
}

export async function fetchTSL(env: string): Promise<ITrustServiceStatusList | null> {
    if (!Atlas.tsl[env as keyof typeof Atlas.tsl]) {
        return null
    }

    const url = Atlas.tsl[env as keyof typeof Atlas.tsl].url;
    return fetch(url).then((response) => response.text()).then((xml) => {
        return parseTrustServiceStatusList(xml);
    })
}

class TrustServiceStatusList {
    schemeInformation: SchemeInformation;
    trustServiceProviderList: TrustServiceProvider[];

   constructor(el: Element) {
        this.schemeInformation = new SchemeInformation(el.querySelector('SchemeInformation')!);
        this.trustServiceProviderList = Array.from(el.querySelectorAll('TrustServiceProvider')).map((el) => new TrustServiceProvider(el));
    }
}

class SchemeInformation {
    tslVersionIdentifier: string;
    tslSequenceNumber: string;
    tslType: string;
    schemeOperatorName: MultiLangString[];
    schemeOperatorAddress: Address;
    schemeName: MultiLangString[];
    schemeInformationURI: MultiLangString[];
    statusDeterminationApproach: string;
    policyOrLegalNotice: PolicyOrLegalNotice | undefined;
    otherTSLPointer: OtherTSLPointer[] | undefined;
    lastIssueDateTime: string;
    nextUpdate: string[] | undefined;
  
    constructor(el: Element) {
        this.tslVersionIdentifier = el.querySelector('TSLVersionIdentifier')?.textContent || '';
        this.tslSequenceNumber = el.querySelector('TSLSequenceNumber')?.textContent || '';
        this.tslType = el.querySelector('TSLType')?.textContent || '';
        this.schemeOperatorName = Array.from(el.querySelectorAll('SchemeOperatorName')).map(toMultiLangString);
        this.schemeOperatorAddress = new Address(el.querySelector('SchemeOperatorAddress')!);
        this.schemeName = Array.from(el.querySelectorAll('SchemeName')).map(toMultiLangString);
        this.schemeInformationURI = Array.from(el.querySelectorAll('SchemeInformationURI')).map(toMultiLangString);
        this.statusDeterminationApproach = el.querySelector('StatusDeterminationApproach')?.textContent || '';
        if (el.querySelector('PolicyOrLegalNotice')) {
            this.policyOrLegalNotice = new PolicyOrLegalNotice(el.querySelector('PolicyOrLegalNotice')!);
        }
        if (el.querySelector('PointersToOtherTSL')) {
            this.otherTSLPointer = Array.from(el.querySelectorAll('OtherTSLPointer')).map((el) => new OtherTSLPointer(el));
        }
        this.lastIssueDateTime = new Date(el.querySelector('ListIssueDateTime')?.textContent || '').toISOString();
        if (el.querySelectorAll('NextUpdate').length > 0) {
            this.nextUpdate = Array.from(el.querySelectorAll('NextUpdate')).map((el) => new Date(el.textContent || '').toISOString());
        }
    }
}

class OtherTSLPointer {
    tslLocation: string;
    additionalInformation: AdditionalInformation | undefined;
    serviceDigitalIdentities: ServiceDigitalIdentity[] | undefined;

    constructor(el: Element) {
        this.tslLocation = el.querySelector('TSLLocation')?.textContent || '';
        if (el.querySelector('AdditionalInformation')) {
            this.additionalInformation = new AdditionalInformation(el.querySelector('AdditionalInformation')!);
        }
        if (el.querySelectorAll('ServiceDigitalIdentity').length > 0) {
            this.serviceDigitalIdentities = Array.from(el.querySelectorAll('ServiceDigitalIdentity')).map((el) => new ServiceDigitalIdentity(el)); 
        }
    }
}

class AdditionalInformation {
    textualInformation: MultiLangString[] | undefined;

    constructor(el: Element) {
        if (el.querySelectorAll('TextualInformation').length > 0) {
            this.textualInformation = Array.from(el.querySelectorAll('TextualInformation')).map(toMultiLangString);
        }
    }
}

class ServiceDigitalIdentity {
    digitalIdentites: DigitalIdentity[];

    constructor(el: Element) {
        this.digitalIdentites = Array.from(el.querySelectorAll('DigitalId')).map((el) => new DigitalIdentity(el));
    }
}

class DigitalIdentity {
    x509Certificate: string | null = null
    certificateInfo: CertificateInfo | null = null
    constructor(el: Element) {
        if (el.querySelector('X509Certificate')) {
            const base64encoded = el.querySelector('X509Certificate')!!.textContent!!;
            const x509 = parseCertificateFromBase64(base64encoded);
            this.x509Certificate = encodeCertificateToPEM(x509);
            this.certificateInfo = toCertificateInfo(x509)
        }
    }
}

class TrustServiceProvider {
    tspInformation: TSPInformation;
    tspServices: TSPService[];
    constructor(el: Element) {
        this.tspInformation = new TSPInformation(el.querySelector('TSPInformation')!);
        this.tspServices = Array.from(el.querySelectorAll('TSPService')).map((el) => new TSPService(el));
    }
}

class TSPInformation {
    tspName: MultiLangString[];
    tspTradeName: MultiLangString[] | undefined;
    tspAddress: Address;
    tspInformationURI: MultiLangURI[]
    tspInformationExtensions: Extension[] | undefined;

    constructor(el: Element) {
        this.tspName = Array.from(el.querySelectorAll('TSPName')).map(toMultiLangString);
        if (el.querySelectorAll('TSPTradeName').length > 0) {
            this.tspTradeName = Array.from(el.querySelectorAll('TSPTradeName')).map(toMultiLangString);
        }
        this.tspAddress = new Address(el.querySelector('TSPAddress')!);
        this.tspInformationURI = Array.from(el.querySelectorAll('TSPInformationURI')).map(toMultiLangURI);
        if (el.querySelectorAll('TSPInformationExtensions').length > 0) {
            this.tspInformationExtensions = Array.from(el.querySelectorAll('TSPInformationExtensions')).map((el) => new Extension(el));
        }
    }
}

class Extension {
    critical: boolean;
    extensionOID: string | null;
    extensionValue: string | null;
    additionalServiceInformation: AdditionalServiceInformation[] | undefined;
    constructor(el: Element) {
        this.critical = el.getAttribute('Critical') === 'true';
        this.extensionOID = queryWithNamespace(el, NS_ETSI_02231_V2, 'ExtensionOID')?.textContent || null;
        this.extensionValue = queryWithNamespace(el, NS_ETSI_02231_V2, 'ExtensionValue')?.textContent || null;
        if (el.querySelectorAll('AdditionalServiceInformation').length > 0) {
            this.additionalServiceInformation = Array.from(el.querySelectorAll('AdditionalServiceInformation')).map((el) => new AdditionalServiceInformation(el));
        }
    }
}

class AdditionalServiceInformation {
    uri: MultiLangURI;
    informationValue: string | null;
    constructor(el: Element) {
        this.uri = toMultiLangURI(el.querySelector('URI')!);
        this.informationValue = el.querySelector('InformationValue')?.textContent || null;
    }
}

class TSPService {
    serviceInformation: ServiceInformation;
    constructor(el: Element) {
        this.serviceInformation = new ServiceInformation(el.querySelector('ServiceInformation')!);
    }
}

class ServiceInformation {
    serviceTypeIdentifier: string;
    serviceName: MultiLangString[];
    serviceDigitalIdentity: ServiceDigitalIdentity;
    serviceStatus: string;
    statusStartingTime: string;
    schemeServiceDefinitionURI: MultiLangURI[] | undefined;
    serviceSupplyPoints: ServiceSupplyPoint[] | undefined;
    serviceInformationExtensions: Extension[] | undefined;
    constructor(el: Element) {
        this.serviceTypeIdentifier = el.querySelector('ServiceTypeIdentifier')?.textContent || '';
        this.serviceName = Array.from(el.querySelectorAll('ServiceName')).map(toMultiLangString);
        this.serviceDigitalIdentity = new ServiceDigitalIdentity(el.querySelector('ServiceDigitalIdentity')!);
        this.serviceStatus = el.querySelector('ServiceStatus')?.textContent || '';
        this.statusStartingTime = new Date(el.querySelector('StatusStartingTime')!!.textContent!!).toISOString();
        if (el.querySelectorAll('SchemeServiceDefinitionURI').length > 0) {
            this.schemeServiceDefinitionURI = Array.from(el.querySelectorAll('SchemeServiceDefinitionURI')).map(toMultiLangURI);
        }
        if (el.querySelectorAll('ServiceSupplyPoints').length > 0) {
            this.serviceSupplyPoints = Array.from(el.querySelectorAll('ServiceSupplyPoint')).map((el) => new ServiceSupplyPoint(el));
        }
        if (el.querySelectorAll('ServiceInformationExtensions').length > 0) {
            this.serviceInformationExtensions = Array.from(el.querySelectorAll('Extension')).map((el) => new Extension(el));
        }
    }
}

class ServiceSupplyPoint {
    type: string | null = null;
    uri: string;
    constructor(el: Element) {
        this.uri = el.textContent || '';
        this.type = el.getAttribute('type');
    }
}

class PolicyOrLegalNotice {
    tslPolicy: MultiLangURI[] | undefined;
    tslLegalNotice: MultiLangString[] | undefined;
    constructor(el: Element) {
        if (el.querySelectorAll('TSLPolicy').length > 0) {
            this.tslPolicy = Array.from(el.querySelectorAll('TSLPolicy')).map(toMultiLangURI);
        }
        if (el.querySelectorAll('TSLLegalNotice').length > 0) {
            this.tslLegalNotice = Array.from(el.querySelectorAll('TSLLegalNotice')).map(toMultiLangString);
        }
    }
}

class Address {
    postalAddresses: PostalAddress[];
    electronicAddress: MultiLangURI[];

    constructor(el: Element) {
        this.postalAddresses = Array.from(el.querySelectorAll('PostalAddress')).map((el) => new PostalAddress(el));
        this.electronicAddress = Array.from(el.querySelectorAll('ElectronicAddress')).map(toMultiLangURI);
    }
}
  
class PostalAddress {
    streetAddress: string;
    locality: string;
    stateOrProvince: string;
    postalCode: number;
    countryName: string;

    constructor(el: Element) {
        this.streetAddress = el.querySelector('StreetAddress')?.textContent || '';
        this.locality = el.querySelector('Locality')?.textContent || '';
        this.stateOrProvince = el.querySelector('StateOrProvince')?.textContent || '';
        this.postalCode = parseInt(el.querySelector('PostalCode')?.textContent || '');
        this.countryName = el.querySelector('CountryName')?.textContent || '';
    }
}
  
function queryWithNamespace(el: Element, namespace: string, localName: string): Element | null {
    var result: Element | null = null;
    for (let child of el.children) {
        if (child.namespaceURI === namespace && child.localName === localName) {
            result = child;
            break;
        }
    }
    return result;
}

export function parseTrustServiceStatusList(xml: string): TrustServiceStatusList {
    const dom = new JSDOM(xml, { contentType: 'text/xml' });
    const root = dom.window.document.documentElement;
    const tsl = new TrustServiceStatusList(root);
    return tsl;
}

function toMultiLangString(el: Element): MultiLangString {
    return {
        lang: el.getAttribute('xml:lang') || 'DE',
        string: el.textContent || ''
    };
}

function toMultiLangURI(el: Element): MultiLangURI {
    return {
        lang: el.getAttribute('xml:lang') || 'DE',
        uri: el.textContent || ''
    };
}
