<script lang="ts">
	import { resolve } from '$app/paths';
	import CheckmarkFilled from 'carbon-icons-svelte/lib/CheckmarkFilled.svelte';
	import WarningAltFilled from 'carbon-icons-svelte/lib/WarningAltFilled.svelte';
	import ErrorFilled from 'carbon-icons-svelte/lib/ErrorFilled.svelte';
	import type { TrustNode } from '$lib/tsl/tsl_api';

	let {
		env,
		nodes,
		current = null
	}: {
		env: string;
		/** End entity first, each issuer below it. */
		nodes: TrustNode[];
		/** The node of the page showing the tree, which is not linked. */
		current?: string | null;
	} = $props();
</script>

<ul class="tree">
	{#each nodes as n, depth (depth)}
		<li style:--depth={depth} class:child={depth > 0}>
			<span class="icon">
				{#if n.state === 'ok'}
					<CheckmarkFilled fill="var(--cds-support-success, #24a148)" />
				{:else if n.state === 'warn'}
					<WarningAltFilled fill="var(--cds-support-warning, #f1c21b)" />
				{:else}
					<ErrorFilled fill="var(--cds-support-error, #da1e28)" />
				{/if}
			</span>
			<span class="name">
				{#if n.id && n.id !== current}
					<a href={resolve('/tsl/[env]/services/[id]', { env, id: n.id })}>{n.name}</a>
				{:else}
					{n.name}
				{/if}
			</span>
			<span class="meta" class:bad={n.state === 'bad'}>{n.role} · {n.note}</span>
		</li>
	{/each}
</ul>

<style>
	.tree {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.25rem 0 0.25rem calc(var(--depth) * 1.5rem);
	}
	/* └ connector from the node above to this one */
	li.child::before {
		content: '';
		position: absolute;
		left: calc((var(--depth) - 1) * 1.5rem + 0.5rem);
		top: -0.25rem;
		width: 0.75rem;
		height: 1rem;
		border-left: 1px solid var(--cds-border-strong, #8d8d8d);
		border-bottom: 1px solid var(--cds-border-strong, #8d8d8d);
	}
	.icon {
		display: inline-flex;
	}
	.name {
		font-weight: 600;
	}
	.meta {
		color: var(--cds-text-secondary, #525252);
	}
	.bad {
		color: var(--cds-support-error, #da1e28);
	}
</style>
