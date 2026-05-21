<script lang="ts">
	import { UnorderedList, ListItem } from 'carbon-components-svelte';
</script>

<h2 class="mt-1">Trusted Lists</h2>

<div class="mt-1">
	<UnorderedList class="mt-1">
		<ListItem><a href="/tsl/test">Test TSL</a></ListItem>
		<ListItem><a href="/tsl/ref">Reference TSL</a></ListItem>
		<ListItem><a href="/tsl/prod">Production TSL</a></ListItem>
	</UnorderedList>
</div>

<style>
	.mt-1 {
		margin-top: 1rem;
	}
</style>
