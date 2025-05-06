<script lang="ts">
	import { type ITrustServiceStatusList, getMultilangText, getTSPScope } from '$lib/tsl/tsl';
	import { getScopeLabel, getScopeColor } from '../tslutil';
	import {
		StructuredList,
		StructuredListHead,
		StructuredListBody,
		StructuredListRow,
		StructuredListCell,
		Tag
	} from 'carbon-components-svelte';
	export let tsl: ITrustServiceStatusList;

	// Sort the trustServiceProviderList alphabetically by tspName before display
	$: sortedProviders = tsl.trustServiceProviderList.slice().sort((a, b) => {
		const nameA = getMultilangText(a.tspInformation.tspName).toLowerCase();
		const nameB = getMultilangText(b.tspInformation.tspName).toLowerCase();
		return nameA.localeCompare(nameB);
	});
</script>

<StructuredList>
	<StructuredListHead>
		<StructuredListRow head>
			<StructuredListCell head class="icon"></StructuredListCell>
			<StructuredListCell head>Provider</StructuredListCell>
			<StructuredListCell head>Scope</StructuredListCell>
		</StructuredListRow>
	</StructuredListHead>
	<StructuredListBody>
		{#each sortedProviders as provider}
			<StructuredListRow>
				<StructuredListCell></StructuredListCell>
				<StructuredListCell>
					{getMultilangText(provider.tspInformation.tspName)}
				</StructuredListCell>
				<StructuredListCell>
					{#each getTSPScope(provider) as scope}
						<Tag type={getScopeColor(scope)}>{getScopeLabel(scope)}</Tag>
					{/each}
				</StructuredListCell>
			</StructuredListRow>
		{/each}
	</StructuredListBody>
</StructuredList>

<style>
</style>
