<script lang="ts">
	import { getEnvLabel } from '$lib';
	import type { PageData } from './$types';
	import {beforeNavigate, afterNavigate} from '$app/navigation';
	export let data: PageData;
	export let loading = true;
	import {
		Breadcrumb,
		BreadcrumbItem,
		Tabs,
		Tab,
		TabContent
    } from "carbon-components-svelte";

	import RawDataView from './RawDataView.svelte';
	import EntityListView from './EntityListView.svelte';
	import MasterView from './MasterView.svelte';
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
	<BreadcrumbItem href="/federations">Föderationen</BreadcrumbItem>
	<BreadcrumbItem isCurrentPage={true}>{getEnvLabel(data.env)}</BreadcrumbItem>
</Breadcrumb>


<h2>{getEnvLabel(data.env)}-Föderation</h2>
<h4>{data.fed.master.iss}</h4>
<Tabs class="tabs">
	<Tab label="Alle" href="#all" on:click={tabClick}/>
	<Tab label="Identity Provider" href="#idp" on:click={tabClick}/>
	<Tab label="Dienste" href="#rp" on:click={tabClick}/>
	<Tab label="Master" href="#master" on:click={tabClick}/>
	<Tab label="Rohdaten" href="#raw" on:click={tabClick}/>
	<svelte:fragment slot="content">
	  <TabContent><EntityListView env={data.env} entities={data.allEntities} /></TabContent>
	  <TabContent><EntityListView env={data.env} entities={data.opEntities} /></TabContent>
	  <TabContent><EntityListView env={data.env} entities={data.rpEntities} /></TabContent>
	  <TabContent><MasterView fed={data.fed}/></TabContent>
	  <TabContent><RawDataView content={data.fed}/></TabContent>
	</svelte:fragment>
</Tabs>

