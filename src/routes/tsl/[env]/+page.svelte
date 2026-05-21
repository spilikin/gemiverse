<script lang="ts">
	import { getEnvLabel } from '$lib';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import RawDataView from '../../RawDataView.svelte';
	import SchemeInformationView from './SchemeInformationView.svelte';
	import ServiceProvidersView from './ServiceProvidersView.svelte';
	import {
		Breadcrumb,
		BreadcrumbItem,
		Tabs,
		Tab,
		TabContent,
		Loading
	} from 'carbon-components-svelte';
	import { onMount } from 'svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let loading = $state(true);

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
	<BreadcrumbItem href="/tsl">Trusted Lists</BreadcrumbItem>
	<BreadcrumbItem isCurrentPage={true}>{getEnvLabel(data.env)}</BreadcrumbItem>
</Breadcrumb>

<h2>{getEnvLabel(data.env)}-TSL</h2>
<h4>
	{data.tsl.schemeInformation.tslSequenceNumber} |
	{data.tsl.schemeInformation.listIssueDateTime.split('T')[0]}
</h4>
<Tabs class="tabs">
	<Tab label="Service Providers" href="#sp" on:click={tabClick} />
	<Tab label="Scheme" href="#scheme" on:click={tabClick} />
	<Tab label="Rohdaten" href="#raw" on:click={tabClick} />
	<svelte:fragment slot="content">
		<TabContent>
			<ServiceProvidersView tsl={data.tsl} />
		</TabContent>
		<TabContent>
			<SchemeInformationView tsl={data.tsl} />
		</TabContent>
		<TabContent><RawDataView content={data.tsl} /></TabContent>
	</svelte:fragment>
</Tabs>
