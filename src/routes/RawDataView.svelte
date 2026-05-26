<script lang="ts">
	import { CodeSnippet } from 'carbon-components-svelte';

	let { content }: { content: object } = $props();

	function toPrettyJSON(c: object) {
		return JSON.stringify(c, null, 2);
	}
</script>

<CodeSnippet type="multi" light={true} expanded>{toPrettyJSON(content)}</CodeSnippet>
