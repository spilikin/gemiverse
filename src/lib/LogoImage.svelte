<script lang="ts">
	import Image from 'carbon-icons-svelte/lib/Image.svelte';

	let { src, alt = 'Logo' }: { src: string | undefined; alt?: string } = $props();

	let failed = $state(false);
	const hasSrc = $derived(!!src && src.trim() !== '');
</script>

<div class="logo-card" role="img" aria-label={hasSrc && !failed ? alt : 'No logo'}>
	{#if hasSrc && !failed}
		<img {src} alt="" class="logo" onerror={() => (failed = true)} />
	{:else}
		<Image size={24} />
	{/if}
</div>

<style>
	/* Third-party brand logos are designed for white backgrounds — light-mode
	   wordmarks, transparent PNGs with dark glyphs, etc. would vanish on a
	   dark page. Standard pattern (Stripe, Vercel, Linear, Apple HIG with
	   <picture>): always render the logo on a fixed-light card, regardless
	   of UI theme, with a themed border so the card itself still feels native
	   in dark mode. */
	.logo-card {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		width: 96px;
		height: 64px;
		padding: 0.5rem;
		background: #ffffff;
		border: 1px solid var(--bx-border-subtle);
		border-radius: 4px;
		vertical-align: middle;
		/* The card is locked light, so the placeholder icon (currentColor)
		   needs an explicit dark grey to stay visible. */
		color: #525252;
	}

	.logo {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}
</style>
