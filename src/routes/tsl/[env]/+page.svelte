<script lang="ts">
	import { getEnvLabel } from '$lib';
	import {beforeNavigate, afterNavigate} from '$app/navigation';
	import RawDataView from '../../RawDataView.svelte';
	import SchemeInformationView from './SchemeInformationView.svelte';
	import ServiceProvidersView from './ServiceProvidersView.svelte';

	import type { PageData } from './$types';    
	export let data: PageData;


	export let loading = true;
	import {
		Breadcrumb,
		BreadcrumbItem,
		Tabs,
		Tab,
		TabContent,
    } from "carbon-components-svelte";

  	import { onMount } from 'svelte';
  	import { goto } from '$app/navigation';

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
    goto((event.target as HTMLAnchorElement).href, { replaceState: true})
  }

	beforeNavigate(() => {
		loading = true;
	});

	afterNavigate(() => {
		loading = false;
	});

</script>

<Breadcrumb>
	<BreadcrumbItem href="/tsl">Trusted Lists</BreadcrumbItem>
	<BreadcrumbItem isCurrentPage={true}>{getEnvLabel(data.env)}</BreadcrumbItem>
</Breadcrumb>

<h2>{getEnvLabel(data.env)}-TSL</h2>
<h4>
	{data.tsl.schemeInformation.tslSequenceNumber} | 
	{new Date(data.tsl.schemeInformation.lastIssueDateTime).toISOString().split('T')[0]}
</h4>
<Tabs class="tabs">
	<Tab label="Service Providers" href="#sp" on:click={tabClick}/>
	<Tab label="Scheme" href="#scheme" on:click={tabClick}/>
	<Tab label="Rohdaten" href="#raw" on:click={tabClick}/>
	<svelte:fragment slot="content">
		<TabContent>
			<ServiceProvidersView tsl={data.tsl}/>
		</TabContent>
		<TabContent>
			<SchemeInformationView tsl={data.tsl}/>
		</TabContent>
		<TabContent><RawDataView content={data.tsl}/></TabContent>
	</svelte:fragment>
</Tabs>

