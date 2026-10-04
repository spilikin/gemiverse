import { error } from '@sveltejs/kit';
import type { CertificateInfo, ServiceView, TslView } from '$ti-wasm/types';
import { displayName } from '../x509';
import { DownloadError, getVerifiedTsl, isTslEnv, type VerifiedTsl } from './tsl_verified.server';
import type {
	Environment,
	SchemeDetail,
	ServiceDetail,
	ServiceList,
	ServiceRow,
	SignatureDetail,
	TrustNode,
	TslSummary
} from './tsl_api';
import { certificateFields } from './tsl_api';

/** The verified TSL of `env` for an endpoint: 404 for an unknown environment, 502 if it cannot be downloaded. */
export async function loadTsl(env: string): Promise<VerifiedTsl> {
	if (!isTslEnv(env)) {
		error(404, 'Unknown environment');
	}
	try {
		return await getVerifiedTsl(env);
	} catch (err) {
		console.error('error verifying TSL for', env, err);
		if (err instanceof DownloadError) error(502, 'TSL download failed');
		error(500, 'Error verifying TSL');
	}
}

const REJECTIONS: Record<string, string> = {
	not_ca: 'not a CA certificate',
	self_signed: 'self-signed, not under a trusted root',
	unknown_issuer: 'issuer is not a trusted root',
	bad_signature: 'signature does not verify under its root'
};

function rejection(code: string | null | undefined): string | null {
	return code ? (REJECTIONS[code] ?? code) : null;
}

function nameOf(view: TslView, fp: string): string {
	const subject = view.certificates[fp]?.subject ?? fp;
	return displayName(subject) ?? subject;
}

function day(iso: string | null | undefined): string | null {
	return iso ? iso.split('T')[0] : null;
}

// Short names for the technical roles the TSL lists under the "unspecified" service type;
// gemSpec_OID's own wording is a sentence too long for a table column.
const ROLE_LABELS: Record<string, string> = {
	oid_tigw_zugm: 'TI-Gateway Zugangsmodul',
	oid_zert_smb: 'SMC-B Zertifikatsausgabestelle'
};

function typeLabel(service: ServiceView): string {
	switch (service.kind) {
		case 'ca':
			return 'CA';
		case 'ocsp':
			return 'OCSP';
		case 'tsl_cert_change':
			return 'TSL CA change';
	}
	const type = service.service_type.split('/Svctype/').pop() ?? service.service_type;
	if (type.startsWith('TrustedList/schemerules')) return 'Scheme rules';
	if (type !== 'unspecified') return type;
	// What the entry is then follows only from the role its extension states.
	const roles = service.type_oids.map(
		(t) => (t.reference && ROLE_LABELS[t.reference]) ?? t.name ?? t.reference ?? t.oid
	);
	return roles.length > 0 ? roles.join(', ') : type;
}

function lastSegment(uri: string): string {
	return uri.split('/').pop() ?? uri;
}

function services(view: TslView): { provider: string; service: ServiceView }[] {
	return view.providers.flatMap((p) =>
		p.services.map((service) => ({ provider: p.name, service }))
	);
}

function validityNote(info: CertificateInfo): string {
	switch (info.validity) {
		case 'valid':
			return `until ${day(info.not_after)}`;
		case 'expired':
			return `expired ${day(info.not_after)}`;
		default:
			return `valid from ${day(info.not_before)}`;
	}
}

function node(view: TslView, fp: string, role: string, link: boolean, trusted: boolean): TrustNode {
	const info = view.certificates[fp];
	return {
		id: link ? fp : null,
		name: nameOf(view, fp),
		role,
		note: validityNote(info),
		state: !trusted ? 'bad' : info.validity === 'valid' ? 'ok' : 'warn'
	};
}

/**
 * The trust tree of a service's certificate, end entity first. An untrusted chain ends in
 * its missing issuer, which carries the reason; a self-signed CA carries it itself.
 */
function serviceTree(
	view: TslView,
	service: ServiceView,
	serviceIDs: Set<string | null>
): TrustNode[] {
	const fp = service.certificate;
	if (!fp) return [];
	const chain = service.chain;
	const isService = (id: string) => serviceIDs.has(id);
	if (!chain) {
		return [
			{
				...node(view, fp, typeLabel(service), true, true),
				note: `status ${lastSegment(service.status)}`,
				state: 'warn'
			}
		];
	}
	// The view's path runs from the certificate up, the order the tree is shown in.
	const path = chain.path;
	const last = path.length - 1;
	if (chain.trusted) {
		return path.map((id, i) =>
			node(view, id, i === 0 ? typeLabel(service) : i === last ? 'root' : 'CA', isService(id), true)
		);
	}
	const reason = rejection(chain.rejection) ?? 'not trusted';
	const nodes = path.map((id, i) =>
		node(view, id, i === 0 ? typeLabel(service) : 'CA', isService(id), false)
	);
	if (chain.rejection === 'self_signed') {
		nodes[last] = { ...nodes[last], note: reason };
		return nodes;
	}
	const issuer = view.certificates[path[last]].issuer;
	// The issuer may be in the list itself, as a CA no trusted root signed.
	const listed = [...serviceIDs].find((id) => id && view.certificates[id]?.subject === issuer);
	return [
		...nodes,
		{
			id: listed ?? null,
			name: displayName(issuer) ?? issuer,
			role: listed ? 'CA' : 'issuer',
			note: listed ? 'not under a trusted root' : 'not a trusted root',
			state: 'bad'
		}
	];
}

function serviceIDsOf(view: TslView): Set<string | null> {
	return new Set(services(view).map(({ service }) => service.certificate));
}

/** The list, its signer and the TSL signer CA, or the list alone with why it is invalid. */
function signatureTree(view: TslView): TrustNode[] {
	const list = view.list;
	const sig = view.signature;
	if (!sig || !list) {
		return [
			{ id: null, name: 'TSL', role: 'list', note: view.error?.detail ?? 'invalid', state: 'bad' }
		];
	}
	return [
		{
			id: null,
			name: `TSL ${list.sequence_number}`,
			role: 'list',
			note: `next update ${day(list.next_update) ?? '–'}`,
			state: list.overdue ? 'warn' : 'ok'
		},
		node(view, sig.signer, 'TSL signer', false, true),
		node(view, sig.tsl_signer_ca, 'TSL signer CA · embedded anchor', false, true)
	];
}

export function summary(env: Environment, view: TslView): TslSummary {
	return {
		environment: env,
		result: view.result,
		tier: view.tier,
		error: view.error,
		sequence_number: view.list?.sequence_number ?? null,
		issued_at: view.list?.issued_at ?? null,
		next_update: view.list?.next_update ?? null,
		overdue: view.list?.overdue ?? false,
		services: view.counts?.services ?? 0
	};
}

export function serviceList(view: TslView): ServiceList {
	const serviceIDs = serviceIDsOf(view);
	return {
		services: services(view).map(({ provider, service }): ServiceRow => {
			const cert = service.certificate ? view.certificates[service.certificate] : null;
			const chain = service.chain;
			return {
				id: service.certificate,
				name: service.certificate ? nameOf(view, service.certificate) : service.name,
				type: typeLabel(service),
				provider,
				status: lastSegment(service.status),
				valid_until: day(cert?.not_after),
				expired: cert ? cert.validity !== 'valid' : false,
				root: chain?.trusted ? nameOf(view, chain.path.at(-1)!) : null,
				rejection: chain && !chain.trusted ? rejection(chain.rejection) : null,
				types: service.type_oids.map((t) => t.reference ?? t.oid),
				tree: serviceTree(view, service, serviceIDs)
			};
		})
	};
}

/** The service whose certificate has fingerprint `id`, with every TSL entry naming it; null if none. */
export function serviceDetail(view: TslView, id: string): ServiceDetail | null {
	const entries = services(view).filter(({ service }) => service.certificate === id);
	const info = view.certificates[id];
	if (entries.length === 0 || !info) return null;

	const withChain = entries.find(({ service }) => service.chain) ?? entries[0];
	return {
		id,
		name: nameOf(view, id),
		entries: entries.map(({ provider, service }) => ({
			provider,
			name: service.name,
			type: typeLabel(service),
			service_type: service.service_type,
			status: lastSegment(service.status),
			in_accord: service.in_accord,
			since: day(service.status_starting_time),
			types: service.type_oids,
			supply_points: service.supply_points
		})),
		tree: serviceTree(view, withChain.service, serviceIDsOf(view)),
		certificate: certificateFields(info)
	};
}

export function signatureDetail(verified: VerifiedTsl): SignatureDetail {
	const view = verified.view;
	const cert = (fp: string | undefined) =>
		fp && view.certificates[fp] ? certificateFields(view.certificates[fp]) : null;
	return {
		result: view.result,
		error: view.error,
		signing_time: view.signature?.signing_time ?? null,
		tree: signatureTree(view),
		signer: cert(view.signature?.signer),
		tsl_signer_ca: cert(view.signature?.tsl_signer_ca),
		warnings: view.signature?.warnings ?? [],
		roots: view.roots
			? {
					source: view.roots.source,
					warning: view.roots.warning,
					names: view.roots.trusted.map((r) => r.common_name)
				}
			: null,
		sources: verified.sources,
		module: { ti_wasm: verified.wasm.ti_wasm, commit: verified.wasm.commit },
		verified_at: verified.computed_at
	};
}

export function schemeDetail(view: TslView): SchemeDetail | null {
	const list = view.list;
	if (!list) return null;
	const s = list.scheme;
	return {
		id: list.id,
		sequence_number: list.sequence_number,
		issued_at: list.issued_at,
		next_update: list.next_update,
		version_identifier: s.version_identifier,
		tsl_type: s.tsl_type,
		scheme_name: s.scheme_name,
		operator_name: s.operator_name,
		postal_addresses: s.postal_addresses,
		electronic_addresses: s.electronic_addresses,
		primary_location: s.primary_location,
		backup_location: s.backup_location
	};
}
