<script lang="ts">
	import type { IPostalAddress } from '$lib/tsl/tsl';
	let { postal }: { postal: IPostalAddress } = $props();
</script>

<div class="postal">
	<div class="postal-line">{postal.streetAddress}</div>
	<div class="postal-line">{postal.postalCode} {postal.locality}</div>
	<div class="postal-line">{postal.stateOrProvince}</div>
	<div class="postal-line">{postal.countryName}</div>
</div>
