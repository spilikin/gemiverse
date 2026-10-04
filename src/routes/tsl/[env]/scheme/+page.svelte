<script lang="ts">
	import { StructuredList, StructuredListBody } from 'carbon-components-svelte';
	import StructuredListField from '$lib/components/StructuredListField.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const scheme = $derived(data.scheme);
	const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '–');
</script>

<StructuredList condensed>
	<StructuredListBody>
		<StructuredListField label="Sequence number">{scheme.sequence_number}</StructuredListField>
		<StructuredListField label="Id">{scheme.id}</StructuredListField>
		<StructuredListField label="Issued">{when(scheme.issued_at)}</StructuredListField>
		<StructuredListField label="Next update">{when(scheme.next_update)}</StructuredListField>
		<StructuredListField label="Version">{scheme.version_identifier ?? '–'}</StructuredListField>
		<StructuredListField label="Type">{scheme.tsl_type}</StructuredListField>
		<StructuredListField label="Scheme name">{scheme.scheme_name}</StructuredListField>
		<StructuredListField label="Operator">{scheme.operator_name}</StructuredListField>
		{#each scheme.postal_addresses as a, i (i)}
			<StructuredListField label="Address">
				<div>{a.street}</div>
				<div>{a.postal_code} {a.locality}</div>
				<div>{a.country}</div>
			</StructuredListField>
		{/each}
		{#if scheme.electronic_addresses.length > 0}
			<StructuredListField label="Contact"
				>{scheme.electronic_addresses.join(', ')}</StructuredListField
			>
		{/if}
		<StructuredListField label="Primary location"
			>{scheme.primary_location ?? '–'}</StructuredListField
		>
		<StructuredListField label="Backup location"
			>{scheme.backup_location ?? '–'}</StructuredListField
		>
	</StructuredListBody>
</StructuredList>
