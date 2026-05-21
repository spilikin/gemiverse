<script lang="ts">
	import { UnorderedList, ListItem } from 'carbon-components-svelte';
	import { resolve } from '$app/paths';
</script>

<h2 class="mt-1">OpenID Federations</h2>

<div class="mt-1">
	<UnorderedList class="mt-1">
		<ListItem><a href={resolve('/federations/test')}>Test Federation</a></ListItem>
		<ListItem><a href={resolve('/federations/ref')}>Reference Federation</a></ListItem>
		<ListItem><a href={resolve('/federations/prod')}>Production Federation</a></ListItem>
	</UnorderedList>
</div>

<style>
	.mt-1 {
		margin-top: 1rem;
	}
</style>
