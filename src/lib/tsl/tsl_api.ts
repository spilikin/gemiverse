// The REST resources under /api/tsl, one per screen under /tsl: the paths are the same.

export type Environment = 'test' | 'ref' | 'prod';

export type Finding = {
	code: string;
	code_number: number | null;
	rule: string;
	detail: string;
};

/** Where a downloaded document came from. */
export type Source = {
	url: string;
	fetched_at: string | null;
	/** The upstream failed; the cached copy was used. */
	stale: boolean;
	sha256: string;
};

/** `/api/tsl/{env}`: the verdict and what the header of every TSL screen shows. */
export type TslSummary = {
	environment: Environment;
	result: 'valid' | 'invalid';
	tier: 'prod' | 'nonprod';
	/** Why the list is invalid. */
	error: Finding | null;
	sequence_number: number | null;
	issued_at: string | null;
	next_update: string | null;
	/** Past next_update, within the grace period. */
	overdue: boolean;
	services: number;
};

/** `/api/tsl`: every environment, or why its list could not be loaded. */
export type TslIndex = {
	environments: (
		| ({ available: true } & TslSummary)
		| { available: false; environment: Environment; message: string }
	)[];
};

/** A row of `/api/tsl/{env}/services`. */
export type ServiceRow = {
	/** The certificate's SHA-256 fingerprint, the `{id}` of its page; null without an X.509 certificate. */
	id: string | null;
	name: string;
	/** CA, OCSP, TSL CA change, or the service type URI's last part. */
	type: string;
	provider: string;
	/** The status URI's last part, e.g. inaccord. */
	status: string;
	valid_until: string | null;
	expired: boolean;
	/** The root the chain ends in, if it is trusted. */
	root: string | null;
	/** Why the chain is not trusted. */
	rejection: string | null;
	/** Certificate type references the list states, e.g. oid_smc_b_aut. */
	types: string[];
	tree: TrustNode[];
};

/** `/api/tsl/{env}/services`. */
export type ServiceList = { services: ServiceRow[] };

/** A node of a trust tree; trees list the end entity first, each issuer below it, the root last. */
export type TrustNode = {
	/** Set when the certificate is a service of the list, the `{id}` of its page. */
	id: string | null;
	name: string;
	/** What the node is: root, CA, OCSP, TSL signer CA, … */
	role: string;
	/** Validity or the reason it is not trusted. */
	note: string;
	/** ok: valid and trusted; warn: trusted but not valid now; bad: not trusted. */
	state: 'ok' | 'warn' | 'bad';
};

/** A TSL entry naming the certificate. */
export type ServiceEntry = {
	provider: string;
	name: string;
	type: string;
	service_type: string;
	status: string;
	in_accord: boolean;
	since: string | null;
	types: { oid: string; reference: string | null; name: string | null }[];
	supply_points: string[];
};

export type CertificateFields = {
	subject: string;
	issuer: string;
	serial: string;
	not_before: string;
	not_after: string;
	expired: boolean;
	key: string;
	key_status: string;
	signature_algorithm: string;
	certificate_type: string | null;
	key_usage: string[];
	ocsp_urls: string[];
	sha256: string;
	pem: string;
};

/** `/api/tsl/{env}/services/{id}`. */
export type ServiceDetail = {
	id: string;
	name: string;
	entries: ServiceEntry[];
	tree: TrustNode[];
	certificate: CertificateFields;
};

/** `/api/tsl/{env}/signature`. */
export type SignatureDetail = {
	result: 'valid' | 'invalid';
	error: Finding | null;
	signing_time: string | null;
	/** The list, its signer, the TSL signer CA. */
	tree: TrustNode[];
	signer: CertificateFields | null;
	tsl_signer_ca: CertificateFields | null;
	warnings: Finding[];
	roots: { source: 'supplied' | 'embedded'; warning: string | null; names: string[] } | null;
	sources: { tsl: Source; roots: Source | null };
	module: { ti_wasm: string; commit: string };
	verified_at: string;
};

/** `/api/tsl/{env}/scheme`. */
export type SchemeDetail = {
	id: string;
	sequence_number: number;
	issued_at: string;
	next_update: string | null;
	version_identifier: number | null;
	tsl_type: string;
	scheme_name: string;
	operator_name: string;
	postal_addresses: {
		street: string;
		postal_code: string;
		locality: string;
		state: string;
		country: string;
	}[];
	electronic_addresses: string[];
	primary_location: string | null;
	backup_location: string | null;
};
