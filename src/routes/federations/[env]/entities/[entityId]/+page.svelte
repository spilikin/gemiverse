<script lang="ts">
	import { getEnvLabel } from '$lib';
	import type { PageData } from './$types';
	import { onMount } from 'svelte';
    

    import RawDataView from '../../RawDataView.svelte';

	export let data: PageData;
	import {
		Breadcrumb,
        BreadcrumbItem,
        Tabs,
        Tab,
        TabContent,
    } from "carbon-components-svelte";
	import OpenidProviderView from './OpenidProviderView.svelte';

    function name() {
        return data.entity.statement?.metadata.federation_entity?.name ?? data.entity.statement?.iss;
    }
</script>

<Breadcrumb noTrailingSlash={true}>
    <BreadcrumbItem href="/federations">Federation</BreadcrumbItem>
    <BreadcrumbItem href="/federations/{data.env}">{getEnvLabel(data.env)}-Föderation</BreadcrumbItem>
    <BreadcrumbItem isCurrentPage={true}>{name()}</BreadcrumbItem>
</Breadcrumb>

<h2>{name()}</h2>

<Tabs triggerHref="#">
    <Tab label="Allgemein" id="general"/>
    <Tab label="Apps" id="apps"/>
    <Tab label="Rohdaten" id="raw"/>
	<svelte:fragment slot="content">
	  <TabContent>
        {#if data.entity.statement?.metadata.openid_provider}
            <OpenidProviderView jwk={data.entity.statement?.jwks?.keys[0]} op={data.entity.statement?.metadata.openid_provider}/>
        {/if}
      </TabContent>
      <TabContent>
        <h4>Android Apps</h4>
        {#each data.entity.androidLinks ?? [] as link}
            <p>{link.target.package_name}</p>            
        {/each}
      </TabContent>
	  <TabContent><RawDataView content={data.entity}/></TabContent>
	</svelte:fragment>
</Tabs>