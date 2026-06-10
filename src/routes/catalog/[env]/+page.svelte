<script lang="ts">
	import { getEnvLabel } from '$lib';
	import type { PageData } from './$types';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import {
		Breadcrumb,
		BreadcrumbItem,
		Tabs,
		Tab,
		TabContent,
		Loading
	} from 'carbon-components-svelte';
	import RawDataView from '../../RawDataView.svelte';
	import VsdmView from './VsdmView.svelte';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();
	let loading = $state(true);

	const updatedAt = $derived(
		new Date(data.catalog.updated_at * 1000)
			.toISOString()
			.replace('T', ' ')
			.replace(/\..*$/, ' UTC')
	);

	onMount(() => {
		const hash = window.location.hash;
		if (hash) {
			const tab = document.querySelector(`a[href="${hash}"]`);
			if (tab) {
				(tab as HTMLAnchorElement).click();
			}
		}
	});

	function tabClick(event: MouseEvent) {
		const hash = (event.target as HTMLAnchorElement).hash;
		history.replaceState(history.state, '', hash);
	}

	beforeNavigate(() => {
		loading = true;
	});

	afterNavigate(() => {
		loading = false;
	});
</script>

{#if loading}
	<Loading />
{/if}

<Breadcrumb>
	<BreadcrumbItem href="/catalog">Catalog</BreadcrumbItem>
	<BreadcrumbItem isCurrentPage={true}>{getEnvLabel(data.env)}</BreadcrumbItem>
</Breadcrumb>

<h2>{getEnvLabel(data.env)}-Catalog</h2>
<h4>{updatedAt}</h4>

<Tabs class="tabs">
	<Tab label="VSDM" href="#vsdm" on:click={tabClick} />
	<Tab label="Rohdaten" href="#raw" on:click={tabClick} />
	<svelte:fragment slot="content">
		<TabContent><VsdmView rows={data.vsdmRows} /></TabContent>
		<TabContent><RawDataView content={data.catalog} /></TabContent>
	</svelte:fragment>
</Tabs>
