<script lang="ts">
	import {
		StructuredList,
		StructuredListHead,
		StructuredListBody,
		StructuredListRow,
		StructuredListCell,
		Tag
	} from 'carbon-components-svelte';
	import type { VsdmRow } from './+page';

	let { rows = [] }: { rows?: VsdmRow[] } = $props();
</script>

<StructuredList>
	<StructuredListHead>
		<StructuredListRow head>
			<StructuredListCell head>IK-Nummer</StructuredListCell>
			<StructuredListCell head>Name</StructuredListCell>
			<StructuredListCell head>Fachdienst</StructuredListCell>
		</StructuredListRow>
	</StructuredListHead>
	<StructuredListBody>
		{#each rows as row (row.identifier)}
			<StructuredListRow>
				<StructuredListCell>
					<span class="ik">{row.identifier}</span>
				</StructuredListCell>
				<StructuredListCell class="nameCell">
					{#if row.name}
						<div class="name" title={row.name}>{row.name}</div>
					{:else}
						<div class="name name-unknown" title="No label found for this IK">—</div>
					{/if}
				</StructuredListCell>
				<StructuredListCell>
					{#if row.fachdienst}
						<span class="fachdienst" title={row.fachdienst}>{row.fachdienst}</span>
					{:else}
						<Tag type="red">unknown service id</Tag>
					{/if}
				</StructuredListCell>
			</StructuredListRow>
		{/each}
	</StructuredListBody>
</StructuredList>

<style>
	.ik {
		font-size: 0.8em;
		color: var(--bx-text-secondary);
		background-color: var(--bx-layer-01);
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
		display: inline-block;
		padding-right: 0.5em;
		padding-left: 0.5em;
		padding-top: 0.2em;
		padding-bottom: 0.2em;
		border-radius: 15%;
	}

	:global(.nameCell) {
		max-width: 18rem;
	}

	.name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.name-unknown {
		color: var(--bx-text-secondary);
	}

	.fachdienst {
		font-size: 0.85em;
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
		color: var(--bx-text-secondary);
		word-break: break-all;
	}
</style>
