import { describe, expect, it } from 'vitest';
import { displayName, dnComponents, expiryState } from './x509';

describe('dnComponents', () => {
	it('splits multi-valued RDNs and keeps escaped separators', () => {
		expect(dnComponents(String.raw`GN=Ullrich+SN=A\+B+CN=Praxis Dr. A\, B,C=DE`)).toEqual([
			{ key: 'GN', value: 'Ullrich' },
			{ key: 'SN', value: 'A+B' },
			{ key: 'CN', value: 'Praxis Dr. A, B' },
			{ key: 'C', value: 'DE' }
		]);
	});

	it('decodes hex escapes and hex DER strings', () => {
		expect(dnComponents(String.raw`SN=Angerm\C3\A4nn`)[0].value).toBe('Angermänn');
		expect(dnComponents('2.5.4.97=#0c0756415444452d31')[0].value).toBe('VATDE-1');
		expect(dnComponents('2.5.4.97=#300100')[0].value).toBe('#300100');
	});
});

describe('displayName', () => {
	it('prefers the common name, wherever it sits', () => {
		expect(
			displayName('GN=Ullrich+SN=Angermänn+SERIALNUMBER=8027+CN=Ullrich AngermännTEST-ONLY,C=DE')
		).toBe('Ullrich AngermännTEST-ONLY');
	});

	it('falls back to given name and surname', () => {
		expect(displayName('GN=Erika+SN=Mustermann+SERIALNUMBER=1,C=DE')).toBe('Erika Mustermann');
		expect(displayName('O=X,C=DE')).toBeNull();
	});
});

describe('expiryState', () => {
	const now = new Date('2026-10-04T00:00:00Z');
	it('grades by days left', () => {
		expect(expiryState('2026-10-01T00:00:00Z', now)).toBe('error');
		expect(expiryState('2026-10-08T00:00:00Z', now)).toBe('error');
		expect(expiryState('2026-10-20T00:00:00Z', now)).toBe('warning');
		expect(expiryState('2027-01-01T00:00:00Z', now)).toBe('success');
	});
});
