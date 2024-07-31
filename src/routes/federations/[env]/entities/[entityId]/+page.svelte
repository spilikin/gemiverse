<script lang="ts">
	import { getEnvLabel } from '$lib';
	import type { PageData } from './$types';    
  import RawDataView from '../../RawDataView.svelte';
  import { goto } from '$app/navigation';

	export let data: PageData;
	import {
		    Breadcrumb,
        BreadcrumbItem,
        Tabs,
        Tab,
        TabContent,
		    Tag,
    } from "carbon-components-svelte";
	import OpenidProviderView from './OpenidProviderView.svelte';
	import OpenidRelyingPartyView from './OpenidRelyingPartyView.svelte';
  import WarningAltFilled from "carbon-icons-svelte/lib/WarningAltFilled.svelte";
	import { onMount } from 'svelte';

  function name() {
      if (data.entity.statement?.metadata.openid_provider) {
          return data.entity.statement?.metadata.federation_entity?.name || data.entity.statement?.iss;
      } else if (data.entity.statement?.metadata.openid_relying_party) {
          return data.entity.statement?.metadata.openid_relying_party?.client_name;
      }
  }

  function iss() {
      return data.entity.statement?.iss;
  }

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
</script>

<style>
  h4 {
    margin-top: 1em;
  }
  :global(.tabs) {
    margin-top: 1em;
  }
</style>

<Breadcrumb noTrailingSlash={true}>
    <BreadcrumbItem href="/federations">Föderationen</BreadcrumbItem>
    <BreadcrumbItem href="/federations/{data.env}">{getEnvLabel(data.env)}</BreadcrumbItem>
    <BreadcrumbItem isCurrentPage={true}>{name()}</BreadcrumbItem>
</Breadcrumb>

{#if data.entity.type == 'openid_provider'}
<h4>{name()}</h4>
<Tag type="green">OpenID Provider</Tag>
{:else}
<h4>{name()}</h4>
<Tag type="blue">Relying Party</Tag>
{/if}

<Tabs class="tabs">
    <Tab label="Allgemein" href="#general" on:click={tabClick}/>
    <Tab label="Apps" href="#apps" on:click={tabClick}/>
    <Tab label="Rohdaten" href="#raw" on:click={tabClick}/>
	<svelte:fragment slot="content">
	  <TabContent>
        {#if data.entity.statement?.metadata.openid_provider}
            <OpenidProviderView entity={data.entity} op={data.entity.statement?.metadata.openid_provider}/>
        {:else if data.entity.statement?.metadata.openid_relying_party}
            <OpenidRelyingPartyView entity={data.entity} rp={data.entity.statement?.metadata.openid_relying_party}/>
        {:else}
        Unbekannter Objekttyp
        {/if}
      </TabContent>
      <TabContent>
        <h4>Android Apps</h4>
        {#if data.entity.androidLinks?.length == 0}
          <p><WarningAltFilled fill="orange"/> Keine Android Apps verknüpft</p>
        {/if}
        {#each data.entity.androidLinks ?? [] as link}
            <p>{link.target.package_name}</p>            
        {/each}
        <br/>
        <h4>Apple Apps</h4>
        {#if data.entity.appleLinks?.length == 0}
          <p><WarningAltFilled fill="orange"/> Keine Apple Apps verknüpft</p>
        {/if}
        {#each data.entity.appleLinks ?? [] as link}
            {#each link.appIDs as appID}
              <p>{appID}</p>
            {/each}            
        {/each}
      </TabContent>
	  <TabContent><RawDataView content={data.entity}/></TabContent>
	</svelte:fragment>
</Tabs>
