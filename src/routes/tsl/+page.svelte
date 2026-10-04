<script lang="ts">
	import { getEnvLabel } from '$lib';
	import { resolve } from '$app/paths';
	import {
		Breadcrumb,
		BreadcrumbItem,
		StructuredList,
		StructuredListHead,
		StructuredListBody,
		StructuredListRow,
		StructuredListCell
	} from 'carbon-components-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Breadcrumb noTrailingSlash>
	<BreadcrumbItem isCurrentPage>Trusted Lists</BreadcrumbItem>
</Breadcrumb>

<h2>Trusted Lists</h2>

<StructuredList>
	<StructuredListHead>
		<StructuredListRow head>
			<StructuredListCell head>Environment</StructuredListCell>
			<StructuredListCell head>Signature</StructuredListCell>
			<StructuredListCell head>Sequence</StructuredListCell>
			<StructuredListCell head>Issued</StructuredListCell>
			<StructuredListCell head>Next update</StructuredListCell>
			<StructuredListCell head>Services</StructuredListCell>
		</StructuredListRow>
	</StructuredListHead>
	<StructuredListBody>
		{#each data.index.environments as tsl (tsl.environment)}
			<StructuredListRow>
				<StructuredListCell>
					<a href={resolve('/tsl/[env]', { env: tsl.environment })}
						>{getEnvLabel(tsl.environment)}</a
					>
				</StructuredListCell>
				{#if tsl.available}
					<StructuredListCell>
						<span class:bad={tsl.result !== 'valid'}>{tsl.result}</span>
					</StructuredListCell>
					<StructuredListCell>{tsl.sequence_number ?? '–'}</StructuredListCell>
					<StructuredListCell>{tsl.issued_at?.split('T')[0] ?? '–'}</StructuredListCell>
					<StructuredListCell>
						<span class:bad={tsl.overdue}>{tsl.next_update?.split('T')[0] ?? '–'}</span>
					</StructuredListCell>
					<StructuredListCell>{tsl.services}</StructuredListCell>
				{:else}
					<StructuredListCell><span class="bad">{tsl.message}</span></StructuredListCell>
					<StructuredListCell></StructuredListCell>
					<StructuredListCell></StructuredListCell>
					<StructuredListCell></StructuredListCell>
					<StructuredListCell></StructuredListCell>
				{/if}
			</StructuredListRow>
		{/each}
	</StructuredListBody>
</StructuredList>

<style>
	h2 {
		margin: 1rem 0;
	}
	.bad {
		color: var(--cds-support-error, #da1e28);
	}
</style>
