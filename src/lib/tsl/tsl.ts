export interface MultiLangString {
	lang: string;
	string: string;
}

export interface MultiLangURI {
	lang: string;
	uri: string;
}

export interface ISchemeInformation {
	tslVersionIdentifier: string;
	tslSequenceNumber: string;
	tslType: string;
}

export interface ITrustServiceStatusList {
	schemeInformation: ISchemeInformation;
	trustServiceProviderList: ITrustServiceProvider[];
}

export interface ISchemeInformation {
	tslVersionIdentifier: string;
	tslSequenceNumber: string;
	tslType: string;
	schemeOperatorName: MultiLangString[];
	schemeOperatorAddress: IAddress;
	schemeName: MultiLangString[];
	schemeInformationURI: MultiLangString[];
	statusDeterminationApproach: string;
	policyOrLegalNotice?: IPolicyOrLegalNotice;
	otherTSLPointer?: IOtherTSLPointer[];
	listIssueDateTime: string;
	nextUpdate?: string[];
}

export interface IOtherTSLPointer {
	tslLocation: string;
	additionalInformation?: IAdditionalInformation;
	serviceDigitalIdentities?: IServiceDigitalIdentity[];
}

export interface IAdditionalInformation {
	textualInformation?: MultiLangString[];
}

export interface IServiceDigitalIdentity {
	digitalIdentites: IDigitalIdentity[];
}

export interface IDigitalIdentity {
	x509Certificate: string | null;
	certificateInfo: ICertificateInfo | null;
	x509SubjectKeyIdentifier: string | null;
}

export interface ITrustServiceProvider {
	tspInformation: ITSPInformation;
	tspServices: ITSPService[];
}

export interface ITSPInformation {
	tspName: MultiLangString[];
	tspTradeName?: MultiLangString[];
	tspAddress: IAddress;
	tspInformationURI: MultiLangURI[];
	tspInformationExtensions?: IExtension[];
}

export interface IExtension {
	critical: boolean;
	extensionOID: string | null;
	extensionValue: string | null;
	additionalServiceInformation?: IAdditionalServiceInformation[];
}

export interface IAdditionalServiceInformation {
	uri: MultiLangURI;
	informationValue: string | null;
}

export interface ITSPService {
	serviceInformation: IServiceInformation;
}

export interface IServiceInformation {
	serviceTypeIdentifier: string;
	serviceName: MultiLangString[];
	serviceDigitalIdentity: IServiceDigitalIdentity;
	serviceStatus: string;
	statusStartingTime: string;
	schemeServiceDefinitionURI?: MultiLangURI[];
	serviceSupplyPoints?: IServiceSupplyPoint[];
	serviceInformationExtensions?: IExtension[];
}

export interface IServiceSupplyPoint {
	type: string | null;
	uri: string;
}

export interface IPolicyOrLegalNotice {
	tslPolicy?: MultiLangURI[];
	tslLegalNotice?: MultiLangString[];
}

export interface IAddress {
	postalAddresses: IPostalAddress[];
	electronicAddress: MultiLangURI[];
}

export interface IPostalAddress {
	streetAddress: string;
	locality: string;
	stateOrProvince: string;
	postalCode: number;
	countryName: string;
}

export interface ICertificateInfo {
	// Define the structure of CertificateInfo if available
}

export function getMultilangText(
	multilang: MultiLangString[],
	lang: string | undefined = undefined
): string {
	if (multilang.length === 0) {
		return '';
	}
	if (!lang) {
		return multilang[0].string;
	}
	const text = multilang.find((ml) => ml.lang === lang);
	return text ? multilang[0].string : '';
}

export function getMultilangURI(
	multilang: MultiLangURI[],
	lang: string | undefined = undefined
): string {
	if (multilang.length === 0) {
		return '';
	}
	if (!lang) {
		return multilang[0].uri;
	}
	const uri = multilang.find((ml) => ml.lang === lang);
	return uri ? multilang[0].uri : '';
}

const oid_tsl_p_loc = '1.2.276.0.76.4.120';
const oid_tsl_b_loc = '1.2.276.0.76.4.121';

export function getPrimaryLocation(schemeInfo: ISchemeInformation) {
	const loc = schemeInfo.otherTSLPointer?.find((pointer) =>
		pointer.additionalInformation?.textualInformation?.find((text) => text.string === oid_tsl_p_loc)
	);
	return loc ? loc.tslLocation : '-';
}

export function getBackupLocation(schemeInfo: ISchemeInformation) {
	const loc = schemeInfo.otherTSLPointer?.find((pointer) =>
		pointer.additionalInformation?.textualInformation?.find((text) => text.string === oid_tsl_b_loc)
	);
	return loc ? loc.tslLocation : '-';
}

export function getTSPScope(tsp: ITrustServiceProvider): string[] {
	const scopes: Set<string> = new Set<string>();
	tsp.tspServices.forEach((service) => {
		service.serviceInformation.serviceInformationExtensions?.forEach((extension) => {
			if (extension.extensionValue === null) {
				return;
			}
			if (extension.extensionValue?.startsWith('oid_egk')) {
				scopes.add('egk');
			} else if (extension.extensionValue?.startsWith('oid_hba')) {
				scopes.add('hba');
			} else if (extension.extensionValue?.startsWith('oid_smc_b')) {
				scopes.add('smc_b');
			} else if (extension.extensionValue === 'oid_cv_rootcert') {
				scopes.add('cv_root');
			} else if (extension.extensionValue === 'oid_tsl_placeholder') {
				// ignore
			} else if (
				[
					'oid_nk_vpn',
					'oid_fd_aut',
					'oid_fd_tls_s',
					'oid_fd_enc',
					'oid_hsk_enc',
					'oid_smkt_aut',
					'oid_sak_aut',
					'oid_zd_tls_s',
					'oid_fd_tls_c',
					'oid_hsk_sig',
					'oid_fd_sig',
					'oid_sgd_hsm_aut',
					'oid_ak_aut',
					'oid_fd_osig',
					'oid_zd_sig',
					'oid_vpnk_vpn_sis',
					'oid_vpnk_vpn',
					'oid_cm_tls_c'
				].includes(extension.extensionValue)
			) {
				scopes.add('comp');
			} else if (extension.extensionValue === 'oid_cv_cert') {
				scopes.add('cv');
			} else {
				scopes.add(extension.extensionValue || 'unknown');
			}
		});
	});

	if (getMultilangText(tsp.tspInformation.tspName).indexOf('Bundesnetzagentur') >= 0) {
		scopes.add('bnetza');
	}

	return Array.from(scopes).sort();
}
