<script lang="ts">
	import {
		StructuredList,
		StructuredListHead,
		StructuredListBody,
		StructuredListRow,
		StructuredListCell,
		Tag
	} from 'carbon-components-svelte';
	import type { InstanceRow } from './+page';

	let { instances = [] }: { instances?: InstanceRow[] } = $props();

	const tagPalette = ['green', 'blue', 'purple', 'magenta', 'teal', 'cyan'] as const;
	type TagColor = (typeof tagPalette)[number];

	function tagColor(type: string): TagColor {
		let h = 0;
		for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
		return tagPalette[h % tagPalette.length];
	}
</script>

<StructuredList>
	<StructuredListHead>
		<StructuredListRow head>
			<StructuredListCell head>Typ</StructuredListCell>
			<StructuredListCell head>Service ID</StructuredListCell>
			<StructuredListCell head>URL</StructuredListCell>
		</StructuredListRow>
	</StructuredListHead>
	<StructuredListBody>
		{#each instances as instance (instance.serviceId)}
			<StructuredListRow id={`instance-${instance.serviceId}`}>
				<StructuredListCell class="typeCell">
					<Tag type={tagColor(instance.type)}>{instance.type}</Tag>
				</StructuredListCell>
				<StructuredListCell>
					<div class="service-id">{instance.serviceId}</div>
				</StructuredListCell>
				<StructuredListCell>
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a class="url" href={instance.url} target="_blank" rel="noopener noreferrer">
						{instance.url}
					</a>
				</StructuredListCell>
			</StructuredListRow>
		{/each}
	</StructuredListBody>
</StructuredList>

<style>
	:global(.typeCell) {
		width: 95px;
	}

	.service-id {
		font-weight: 600;
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
	}

	.url {
		font-size: 0.85em;
		color: var(--bx-link-primary);
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
		word-break: break-all;
	}
</style>
