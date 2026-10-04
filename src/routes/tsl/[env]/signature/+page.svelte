<script lang="ts">
	import { StructuredList, StructuredListBody } from 'carbon-components-svelte';
	import StructuredListField from '$lib/components/StructuredListField.svelte';
	import CertificateFieldsView from '$lib/components/CertificateFieldsView.svelte';
	import TrustTree from '$lib/components/TrustTree.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const sig = $derived(data.signature);
	const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '–');
</script>

<h4 class="first">Trust</h4>
<TrustTree env={data.env} nodes={sig.tree} />

<h4>Verification</h4>
<StructuredList condensed>
	<StructuredListBody>
		<StructuredListField label="Result">
			<span class:bad={sig.result !== 'valid'}>{sig.result}</span>
			{#if sig.error}
				<div class="bad">{sig.error.detail} ({sig.error.code}, {sig.error.rule})</div>
			{/if}
		</StructuredListField>
		{#if sig.signing_time}
			<StructuredListField label="Signing time">{when(sig.signing_time)}</StructuredListField>
		{/if}
		{#each sig.warnings as warning (warning.code)}
			<StructuredListField label="Warning">
				{warning.detail} ({warning.code}, {warning.rule})
			</StructuredListField>
		{/each}
		{#if sig.roots}
			<StructuredListField label="Trusted roots">
				{sig.roots.names.join(', ')}
				<div class="dim">
					from {sig.roots.source === 'supplied'
						? 'the downloaded roots.json'
						: 'the embedded roots'}
				</div>
				{#if sig.roots.warning}<div class="bad">{sig.roots.warning}</div>{/if}
			</StructuredListField>
		{/if}
		<StructuredListField label="Downloaded from">
			{sig.sources.tsl.url}
			<div class="dim">
				{when(sig.sources.tsl.fetched_at)}{sig.sources.tsl.stale ? ' (cached copy)' : ''}
			</div>
		</StructuredListField>
		<StructuredListField label="Raw">
			<a href="/api/tsl/{data.env}/xml" rel="external">TSL XML</a>
		</StructuredListField>
		<StructuredListField label="Verified">
			{when(sig.verified_at)}
			<div class="dim">ti-wasm {sig.module.ti_wasm} ({sig.module.commit.slice(0, 7)})</div>
		</StructuredListField>
	</StructuredListBody>
</StructuredList>

{#if sig.signer}
	<h4>Signer certificate</h4>
	<CertificateFieldsView certificate={sig.signer} />
{/if}
{#if sig.tsl_signer_ca}
	<h4>TSL signer CA certificate</h4>
	<CertificateFieldsView certificate={sig.tsl_signer_ca} />
{/if}

<style>
	h4 {
		margin: 1.5rem 0 0.5rem;
	}
	h4.first {
		margin-top: 0;
	}
	.bad {
		color: var(--cds-support-error, #da1e28);
	}
	.dim {
		color: var(--cds-text-secondary, #525252);
	}
</style>
