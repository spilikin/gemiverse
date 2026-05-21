<script lang="ts">
	import type { Federation } from '$lib/federations/federations';
	export let fed: Federation;
	import {
		StructuredList,
		StructuredListHead,
		StructuredListBody,
		StructuredListRow,
		StructuredListCell,
		CodeSnippet
	} from 'carbon-components-svelte';

	function toPrettyJSON(o: object | undefined) {
		return JSON.stringify(o, null, 2);
	}
</script>

<StructuredList>
	<StructuredListBody>
		<StructuredListRow>
			<StructuredListCell class="master-view-icon"></StructuredListCell>
			<StructuredListCell class="master-view-label">Issuer</StructuredListCell>
			<StructuredListCell class="master-view-value">
				{fed.master.iss}
			</StructuredListCell>
		</StructuredListRow>
		<StructuredListRow>
			<StructuredListCell class="master-view-icon"></StructuredListCell>
			<StructuredListCell class="master-view-label">Public key</StructuredListCell>
			<StructuredListCell class="master-view-value">
				<CodeSnippet type="multi" light={true} expanded
					>{toPrettyJSON(fed.master.jwks?.keys[0])}</CodeSnippet
				>
			</StructuredListCell>
		</StructuredListRow>
	</StructuredListBody>
</StructuredList>

<style>
	:global {
		.master-view-icon {
			width: 20px;
			height: 20px;
		}
		.master-view-label {
			font-weight: bold;
			width: 200px;
		}
	}
</style>
