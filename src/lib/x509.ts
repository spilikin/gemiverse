export interface CertificateInfo {
	subject: string;
	issuer: string;
	serialNumber: string;
	keyType?: string;
	keyAlg?: string;
	notBefore: Date;
	notAfter: Date;
}

export type ExpiryState = 'error' | 'warning' | 'success';

/** Expired or within 7 days: error; within 30 days: warning. */
export function expiryState(notAfter: string | Date, now: Date = new Date()): ExpiryState {
	const diff = new Date(notAfter).getTime() - now.getTime();
	if (diff < 1000 * 60 * 60 * 24 * 7) {
		return 'error';
	} else if (diff < 1000 * 60 * 60 * 24 * 30) {
		return 'warning';
	}
	return 'success';
}

export type DNComponent = { key: string; value: string };

/**
 * The attribute=value components of an RFC 4514 name in its order. The values of a
 * multi-valued RDN (`GN=…+SN=…+CN=…`, as on an HBA) come one by one, escapes are undone
 * (`\,`, `\+`, `\C3\A4`), and a `#`-hex DER string is shown as its text where it is one.
 */
export function dnComponents(dn: string): DNComponent[] {
	const parts: string[] = [];
	let current = '';
	let escaped = false;
	for (const c of dn) {
		if (escaped) {
			current += c;
			escaped = false;
		} else if (c === '\\') {
			current += c;
			escaped = true;
		} else if (c === ',' || c === '+') {
			parts.push(current);
			current = '';
		} else {
			current += c;
		}
	}
	if (current !== '') parts.push(current);
	return parts.map((part) => {
		const eq = part.indexOf('=');
		return eq < 0
			? { key: '', value: unescapeDN(part) }
			: { key: part.slice(0, eq), value: unescapeDN(part.slice(eq + 1)) };
	});
}

/** The name to show: the common name, else given name and surname; null without either. */
export function displayName(dn: string): string | null {
	const components = dnComponents(dn);
	const first = (...keys: string[]) => components.find((c) => keys.includes(c.key))?.value;
	const cn = first('CN');
	if (cn) return cn;
	const person = [first('GN', 'givenName'), first('SN', 'surname')].filter(Boolean).join(' ');
	return person || null;
}

function unescapeDN(value: string): string {
	if (value.startsWith('#')) {
		const text = derString(value.slice(1));
		if (text !== null) return text;
	}
	const bytes: number[] = [];
	const encoder = new TextEncoder();
	for (let i = 0; i < value.length; i++) {
		const c = value[i];
		if (c !== '\\') {
			bytes.push(...encoder.encode(c));
			continue;
		}
		const hex = value.slice(i + 1, i + 3);
		if (/^[0-9a-fA-F]{2}$/.test(hex)) {
			bytes.push(parseInt(hex, 16));
			i += 2;
		} else if (i + 1 < value.length) {
			bytes.push(...encoder.encode(value[i + 1]));
			i += 1;
		}
	}
	return new TextDecoder().decode(new Uint8Array(bytes));
}

/** UTF8String, PrintableString, TeletexString or IA5String with a short-form length. */
function derString(hex: string): string | null {
	if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) return null;
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
	const [tag, len] = bytes;
	if (![0x0c, 0x13, 0x14, 0x16].includes(tag) || len >= 0x80 || len !== bytes.length - 2) {
		return null;
	}
	try {
		return new TextDecoder('utf-8', { fatal: true }).decode(bytes.slice(2));
	} catch {
		return null;
	}
}
