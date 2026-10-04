<script lang="ts">
	import { StructuredList, StructuredListBody } from 'carbon-components-svelte';
	import StructuredListField from './StructuredListField.svelte';
	import type { CertificateFields } from '$lib/tsl/tsl_api';
	import { displayName } from '$lib/x509';

	let { certificate }: { certificate: CertificateFields } = $props();

	const day = (iso: string) => iso.split('T')[0];

	function download() {
		const url = URL.createObjectURL(
			new Blob([certificate.pem], { type: 'application/x-pem-file' })
		);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${(displayName(certificate.subject) ?? 'certificate').replace(/[^\w.-]+/g, '_')}.pem`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<StructuredList condensed>
	<StructuredListBody>
		<StructuredListField label="Subject">{certificate.subject}</StructuredListField>
		<StructuredListField label="Issuer">{certificate.issuer}</StructuredListField>
		<StructuredListField label="Valid">
			{day(certificate.not_before)} –
			<span class:bad={certificate.expired}>{day(certificate.not_after)}</span>
		</StructuredListField>
		<StructuredListField label="Type">{certificate.certificate_type ?? '–'}</StructuredListField>
		<StructuredListField label="Key"
			>{certificate.key} ({certificate.key_status})</StructuredListField
		>
		<StructuredListField label="Key usage"
			>{certificate.key_usage.join(', ') || '–'}</StructuredListField
		>
		{#if certificate.ocsp_urls.length > 0}
			<StructuredListField label="OCSP">{certificate.ocsp_urls.join(', ')}</StructuredListField>
		{/if}
		<StructuredListField label="Serial">{certificate.serial}</StructuredListField>
		<StructuredListField label="SHA-256"
			><span class="wrap">{certificate.sha256}</span></StructuredListField
		>
		<StructuredListField label="PEM">
			<button class="link" onclick={download}>Download</button>
		</StructuredListField>
	</StructuredListBody>
</StructuredList>

<style>
	.bad {
		color: var(--cds-support-error, #da1e28);
	}
	.wrap {
		word-break: break-all;
	}
	.link {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: var(--cds-link-primary, #0f62fe);
		cursor: pointer;
	}
	.link:hover {
		text-decoration: underline;
	}
</style>
