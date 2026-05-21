<script lang="ts">
	import { StructuredListRow, StructuredListCell } from 'carbon-components-svelte';
	import type { Snippet } from 'svelte';

	let { label, children }: { label: string; children?: Snippet } = $props();
</script>

<StructuredListRow>
	<StructuredListCell class="sl-field-icon"></StructuredListCell>
	<StructuredListCell class="sl-field-label">
		{label}
	</StructuredListCell>
	<StructuredListCell class="sl-field-value">
		{@render children?.()}
	</StructuredListCell>
</StructuredListRow>

<style>
	:global {
		.sl-field-icon {
			width: 20px;
			height: 20px;
		}
		.sl-field-label {
			font-weight: bold;
			width: 200px;
		}
	}
</style>
