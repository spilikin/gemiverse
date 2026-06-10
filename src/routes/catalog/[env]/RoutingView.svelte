<script lang="ts">
	import {
		StructuredList,
		StructuredListHead,
		StructuredListBody,
		StructuredListRow,
		StructuredListCell,
		Tag
	} from 'carbon-components-svelte';
	import type { RoutingGroup } from './+page';

	let { groups = [] }: { groups?: RoutingGroup[] } = $props();
</script>

{#each groups as group (group.serviceType)}
	<section class="routing-group">
		<h4>{group.serviceType}</h4>
		<StructuredList>
			<StructuredListHead>
				<StructuredListRow head>
					<StructuredListCell head>Identifier</StructuredListCell>
					<StructuredListCell head>Service ID</StructuredListCell>
					<StructuredListCell head>URL</StructuredListCell>
				</StructuredListRow>
			</StructuredListHead>
			<StructuredListBody>
				{#each group.rows as row (row.identifier)}
					<StructuredListRow>
						<StructuredListCell>
							<span class="identifier">{row.identifier}</span>
						</StructuredListCell>
						<StructuredListCell>
							<a class="service-id" href={`#instance-${row.serviceId}`}>{row.serviceId}</a>
						</StructuredListCell>
						<StructuredListCell>
							{#if row.instance}
								<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
								<a class="url" href={row.instance.url} target="_blank" rel="noopener noreferrer">
									{row.instance.url}
								</a>
							{:else}
								<Tag type="red">unknown service id</Tag>
							{/if}
						</StructuredListCell>
					</StructuredListRow>
				{/each}
			</StructuredListBody>
		</StructuredList>
	</section>
{/each}

<style>
	.routing-group {
		margin-bottom: 2rem;
	}

	.routing-group h4 {
		margin: 0 0 0.5rem;
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
	}

	.identifier {
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
	}

	.service-id {
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
		color: var(--bx-link-primary);
	}

	.url {
		font-size: 0.85em;
		color: var(--bx-link-primary);
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
		word-break: break-all;
	}
</style>
