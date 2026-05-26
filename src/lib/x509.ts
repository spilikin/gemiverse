export interface CertificateInfo {
	subject: string;
	issuer: string;
	serialNumber: string;
	keyType?: string;
	keyAlg?: string;
	notBefore: Date;
	notAfter: Date;
}
