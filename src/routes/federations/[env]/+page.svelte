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


{#if loading}
<Loading/>
{:else}
<h2>{getEnvLabel(data.env)}-Föderation</h2>
<h4>{data.fed.master.iss}</h4>
<Tabs triggerHref="#">
	<Tab label="Alle" id="all"/>
	<Tab label="Identity Provider" href="#op" />
	<Tab label="Dienste" href="#rp"/>
	<Tab label="Master" href="#master"/>
	<Tab label="Rohdaten" href="#raw"/>
	<svelte:fragment slot="content">
	  <TabContent><EntityListView env={data.env} entities={getAll()} /></TabContent>
	  <TabContent><EntityListView env={data.env} entities={getIdentityProviders()} /></TabContent>
	  <TabContent><EntityListView env={data.env} entities={getRelyingParties()} /></TabContent>
	  <TabContent><MasterView fed={data.fed}/></TabContent>
	  <TabContent><RawDataView content={data.fed}/></TabContent>
	</svelte:fragment>
</Tabs>
{/if}

