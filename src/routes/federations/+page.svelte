<script lang="ts">
	import {
		UnorderedList,
		ListItem,
    } from "carbon-components-svelte";

</script>

<style>
	.mt-1 {
		margin-top: 1rem;
	}
</style>

<h2 class="mt-1">OpenID Federations</h2>

<div class="mt-1">
<UnorderedList class="mt-1">
    <ListItem><a href="/federations/test">Test Federation</a></ListItem>
    <ListItem><a href="/federations/ref">Reference Federation</a></ListItem>
    <ListItem><a href="/federations/prod">Production Federation</a></ListItem>
</UnorderedList>
</div>