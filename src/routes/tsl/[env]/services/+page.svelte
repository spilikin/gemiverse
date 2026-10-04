<script lang="ts">
	import { resolve } from '$app/paths';
	import { DataTable, Toolbar, ToolbarContent, ToolbarSearch } from 'carbon-components-svelte';
	import type { DataTableRow } from 'carbon-components-svelte/src/DataTable/DataTable.svelte';
	import TrustTree from '$lib/components/TrustTree.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const headers = [
		{ key: 'name', value: 'Service' },
		{ key: 'type', value: 'Type' },
		{ key: 'provider', value: 'Provider' },
		{ key: 'valid_until', value: 'Valid until' },
		{ key: 'chain', value: 'Chain' }
	];

	const rows = $derived(
		data.list.services.map((s, i) => ({
			...s,
			key: s.id,
			id: i,
			chain: s.root ?? s.rejection ?? ''
		}))
	);

	// The certificate types are searchable too, e.g. oid_smc_b_aut.
	function matches(row: DataTableRow, value: string | number) {
		const needle = String(value).toLowerCase();
		return [row.name, row.type, row.provider, row.chain, ...row.types].some((v) =>
			String(v ?? '')
				.toLowerCase()
				.includes(needle)
		);
	}
</script>

{#if data.list.services.length === 0}
	<p>The list is invalid; it has no services to show.</p>
{:else}
	<DataTable
		sortable
		size="short"
		{headers}
		{rows}
		expandable
		nonExpandableRowIds={rows.filter((r) => r.tree.length === 0).map((r) => r.id)}
	>
		<Toolbar>
			<ToolbarContent>
				<ToolbarSearch persistent shouldFilterRows={matches} placeholder="Search services" />
			</ToolbarContent>
		</Toolbar>
		<svelte:fragment slot="cell" let:row let:cell>
			{#if cell.key === 'name' && row.key}
				<a href={resolve('/tsl/[env]/services/[id]', { env: data.env, id: row.key })}
					>{cell.value}</a
				>
			{:else if cell.key === 'valid_until'}
				<span class="date" class:bad={row.expired}>{cell.value ?? ''}</span>
			{:else if cell.key === 'chain'}
				<span class:bad={row.rejection}>{cell.value}</span>
			{:else}
				{cell.value}
			{/if}
		</svelte:fragment>
		<svelte:fragment slot="expanded-row" let:row>
			<TrustTree env={data.env} nodes={row.tree} />
		</svelte:fragment>
	</DataTable>
{/if}

<style>
	.date {
		white-space: nowrap;
	}
	.bad {
		color: var(--cds-support-error, #da1e28);
	}
</style>
