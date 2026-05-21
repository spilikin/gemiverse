<script lang="ts">
	import { getEnvLabel } from '$lib';
	import type { PageData } from './$types';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	export let data: PageData;
	export let loading = true;
	import {
		Breadcrumb,
		BreadcrumbItem,
		Tabs,
		Tab,
		TabContent,
		Button,
		Loading
	} from 'carbon-components-svelte';

	import Download from 'carbon-icons-svelte/lib/Download.svelte';

	import RawDataView from '../../RawDataView.svelte';
	import EntityListView from './EntityListView.svelte';
	import MasterView from './MasterView.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/state';

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
		goto((event.target as HTMLAnchorElement).href, { replaceState: true });
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
	<BreadcrumbItem href="/federations">Föderationen</BreadcrumbItem>
	<BreadcrumbItem isCurrentPage={true}>{getEnvLabel(data.env)}</BreadcrumbItem>
</Breadcrumb>

<div class="heading-bar">
	<h2>{getEnvLabel(data.env)}-Föderation</h2>
	<Button kind="tertiary" size="sm" href={`/api/federations/${data.env}/export`} download
		><Download /> Export</Button
	>
</div>
<h4>{data.fed.master.iss}</h4>
<Tabs class="tabs">
	<Tab label="Alle" href="#all" on:click={tabClick} />
	<Tab label="Identity Provider" href="#idp" on:click={tabClick} />
	<Tab label="Dienste" href="#rp" on:click={tabClick} />
	<Tab label="Master" href="#master" on:click={tabClick} />
	<Tab label="Rohdaten" href="#raw" on:click={tabClick} />
	<svelte:fragment slot="content">
		<TabContent><EntityListView env={data.env} entities={data.allEntities} /></TabContent>
		<TabContent><EntityListView env={data.env} entities={data.opEntities} /></TabContent>
		<TabContent><EntityListView env={data.env} entities={data.rpEntities} /></TabContent>
		<TabContent><MasterView fed={data.fed} /></TabContent>
		<TabContent><RawDataView content={data.fed} /></TabContent>
	</svelte:fragment>
</Tabs>

<style>
	.heading-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.heading-bar h2 {
		margin: 0;
	}
</style>
