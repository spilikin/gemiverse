<script lang="ts">
	import { getMultilangText, getPrimaryLocation, getBackupLocation } from '$lib/tsl/tsl';
	import AddressView from './AddressView.svelte';
	import type { ITrustServiceStatusList } from '$lib/tsl/tsl';
	import { StructuredList, StructuredListBody } from 'carbon-components-svelte';

	import StructuredListField from './StructuredListField.svelte';

	let { tsl }: { tsl: ITrustServiceStatusList } = $props();

	const primaryLocation = $derived(getPrimaryLocation(tsl.schemeInformation));
	const backupLocation = $derived(getBackupLocation(tsl.schemeInformation));

	function formatDateTime(isoString: string | null): string {
		if (!isoString || isoString === '') {
			return '';
		}
		return new Date(isoString).toLocaleString();
	}
</script>

<StructuredList>
	<StructuredListBody>
		<StructuredListField label="TSL Version Identifier">
			{tsl.schemeInformation.tslVersionIdentifier}
		</StructuredListField>
		<StructuredListField label="TSL Sequence Number">
			{tsl.schemeInformation.tslSequenceNumber}
		</StructuredListField>
		<StructuredListField label="Issue Date Time">
			{formatDateTime(tsl.schemeInformation.listIssueDateTime)}
		</StructuredListField>
		{#if tsl.schemeInformation.nextUpdate}
			<StructuredListField label="Next Update">
				{#each tsl.schemeInformation.nextUpdate as nextUpdate (nextUpdate)}
					{formatDateTime(nextUpdate)}<br />
				{/each}
			</StructuredListField>
		{/if}
		<StructuredListField label="TSL Type">
			<code>{tsl.schemeInformation.tslType}</code>
		</StructuredListField>
		<StructuredListField label="Scheme Name">
			{getMultilangText(tsl.schemeInformation.schemeName)}
		</StructuredListField>
		<StructuredListField label="Scheme Operator">
			{getMultilangText(tsl.schemeInformation.schemeOperatorName)}
		</StructuredListField>
		<StructuredListField label="Postal Address">
			{#each tsl.schemeInformation.schemeOperatorAddress.postalAddresses as postal, i (i)}
				<AddressView {postal} />
			{/each}
		</StructuredListField>
		<StructuredListField label="Primary Location">
			<code>{primaryLocation}</code>
		</StructuredListField>
		<StructuredListField label="Backup Location">
			<code>{backupLocation}</code>
		</StructuredListField>
	</StructuredListBody>
</StructuredList>
