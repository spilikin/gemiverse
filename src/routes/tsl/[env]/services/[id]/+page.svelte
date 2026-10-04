<script lang="ts">
	import { StructuredList, StructuredListBody } from 'carbon-components-svelte';
	import StructuredListField from '$lib/components/StructuredListField.svelte';
	import CertificateFieldsView from '$lib/components/CertificateFieldsView.svelte';
	import TrustTree from '$lib/components/TrustTree.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const service = $derived(data.service);
</script>

<h3>{service.name}</h3>

<h4>Trust</h4>
<TrustTree env={data.env} nodes={service.tree} current={service.id} />

<h4>TSL entry</h4>
{#each service.entries as entry, i (i)}
	<StructuredList condensed>
		<StructuredListBody>
			<StructuredListField label="Provider">{entry.provider}</StructuredListField>
			<StructuredListField label="Type">{entry.type}</StructuredListField>
			<StructuredListField label="Service type">{entry.service_type}</StructuredListField>
			<StructuredListField label="Status">
				<span class:bad={!entry.in_accord}>{entry.status}</span>
				{#if entry.since}since {entry.since}{/if}
			</StructuredListField>
			{#if entry.types.length > 0}
				<StructuredListField label="Certificate types">
					{#each entry.types as t (t.oid)}
						<div>{t.reference ?? t.oid}{t.name ? ` (${t.name})` : ''}</div>
					{/each}
				</StructuredListField>
			{/if}
			{#if entry.supply_points.length > 0}
				<StructuredListField label="Supply points">
					{#each entry.supply_points as point (point)}
						<div>{point}</div>
					{/each}
				</StructuredListField>
			{/if}
		</StructuredListBody>
	</StructuredList>
{/each}

<h4>Certificate</h4>
<CertificateFieldsView certificate={service.certificate} />

<style>
	h3 {
		margin-bottom: 1rem;
	}
	h4 {
		margin: 1.5rem 0 0.5rem;
	}
	.bad {
		color: var(--cds-support-error, #da1e28);
	}
</style>
