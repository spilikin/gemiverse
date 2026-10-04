<script lang="ts">
	import { getEnvLabel } from '$lib';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Breadcrumb, BreadcrumbItem, Tabs, Tab } from 'carbon-components-svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	// Tabs, breadcrumb and REST resource share one path: /tsl/{env}/{tab} ↔ /api/tsl/{env}/{tab}.
	const tabs = [
		{ path: 'services', route: '/tsl/[env]/services', label: 'Services' },
		{ path: 'signature', route: '/tsl/[env]/signature', label: 'Signature' },
		{ path: 'scheme', route: '/tsl/[env]/scheme', label: 'Scheme' }
	] as const;

	const section = $derived(page.url.pathname.split('/')[3] ?? 'services');
	const selected = $derived(
		Math.max(
			0,
			tabs.findIndex((t) => t.path === section)
		)
	);
	const tab = $derived(tabs[selected]);
	const item = $derived((page.data as { title?: string }).title ?? null);
	const summary = $derived(data.summary);
	const day = (iso: string | null) => iso?.split('T')[0] ?? '–';

	function open(index: number) {
		if (index !== selected) goto(resolve(tabs[index].route, { env: data.env }));
	}
</script>

<Breadcrumb noTrailingSlash>
	<BreadcrumbItem href={resolve('/tsl')}>Trusted Lists</BreadcrumbItem>
	<BreadcrumbItem href={resolve('/tsl/[env]', { env: data.env })}
		>{getEnvLabel(data.env)}</BreadcrumbItem
	>
	{#if item}
		<BreadcrumbItem href={resolve(tab.route, { env: data.env })}>{tab.label}</BreadcrumbItem>
		<BreadcrumbItem isCurrentPage>{item}</BreadcrumbItem>
	{:else}
		<BreadcrumbItem isCurrentPage>{tab.label}</BreadcrumbItem>
	{/if}
</Breadcrumb>

<h2>{getEnvLabel(data.env)}-TSL</h2>
<p class="summary">
	{#if summary.result === 'valid'}
		Signature valid · sequence {summary.sequence_number} · issued {day(summary.issued_at)} · next update
		<span class:bad={summary.overdue}>{day(summary.next_update)}</span>
	{:else}
		<span class="bad">Signature not valid: {summary.error?.detail}</span>
	{/if}
</p>

<Tabs {selected} on:change={(e) => open(e.detail)}>
	{#each tabs as t (t.path)}
		<Tab label={t.label} href={resolve(t.route, { env: data.env })} />
	{/each}
</Tabs>

<div class="content">
	{@render children()}
</div>

<style>
	h2 {
		margin-top: 1rem;
	}
	.summary {
		margin: 0.5rem 0 1rem;
	}
	.bad {
		color: var(--cds-support-error, #da1e28);
	}
	.content {
		margin-top: 1rem;
	}
</style>
