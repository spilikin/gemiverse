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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ICertificateInfo {
	// Define the structure of CertificateInfo if available
}
