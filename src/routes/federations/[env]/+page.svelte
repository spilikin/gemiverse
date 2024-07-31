<script lang="ts">
	import { getEnvLabel } from '$lib';
	import type { PageData } from './$types';
	import {beforeNavigate, afterNavigate} from '$app/navigation';
	export let data: PageData;
	export let loading = true;
	import {
		Loading,
		Breadcrumb,
		BreadcrumbItem,
		Tabs,
		Tab,
		TabContent
    } from "carbon-components-svelte";

	import RawDataView from './RawDataView.svelte';
	import EntityListView from './EntityListView.svelte';
	import MasterView from './MasterView.svelte';
	import type { Entity } from '$lib/federations';
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

	function sortEntities(a: Entity, b: Entity) {
		return (a.statement?.metadata.federation_entity?.name ?? "").localeCompare(b.statement?.metadata.federation_entity?.name ?? "");
	}

	function getAll() {
		return data.fed.entities.sort(sortEntities);
	}

	function getIdentityProviders() {
		return data.fed.entities.filter((entity) => entity.statement?.metadata.openid_provider !== undefined).sort(sortEntities);
	}

	function getRelyingParties() {
		return data.fed.entities.filter((entity) => entity.statement?.metadata.openid_relying_party !== undefined).sort(sortEntities);
	}

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
	  <TabContent><EntityListView env={data.env} entities={getAll()} /></TabContent>
	  <TabContent><EntityListView env={data.env} entities={getIdentityProviders()} /></TabContent>
	  <TabContent><EntityListView env={data.env} entities={getRelyingParties()} /></TabContent>
	  <TabContent><MasterView fed={data.fed}/></TabContent>
	  <TabContent><RawDataView content={data.fed}/></TabContent>
	</svelte:fragment>
</Tabs>

