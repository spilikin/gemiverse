<script lang="ts">	
    import { type Entity, entityIdentifier } from '$lib/federations';
    import { goto } from '$app/navigation';
    export let env = '';
	export let entities: Entity[] = [];
	import {
		StructuredList,
		StructuredListHead,
		StructuredListBody,
		StructuredListRow,
		StructuredListCell,
    } from "carbon-components-svelte";
    import CloseFilled from "carbon-icons-svelte/lib/CloseFilled.svelte";

    function logo(entity: Entity) {
        if (entity.statement?.metadata.openid_provider?.logo_uri) {
            return entity.statement?.metadata.openid_provider?.logo_uri;
        } else if (entity.statement?.metadata.openid_relying_party?.logo_uri) {
            return entity.statement?.metadata.openid_relying_party?.logo_uri;
        }
        return undefined;
    }

    function openEntity(entity: Entity) {
        goto(`/federations/${env}/entities/${entityIdentifier(entity.statement!)}`)
    }
</script>

<style>
    .logo {
        max-height: 50px;
        max-width: 90px;
        vertical-align: middle;
    }
    :global(.logoCell) {
        width: 95px;
    }        
</style>

<StructuredList selection>
	<StructuredListHead>
		<StructuredListRow head>
			<StructuredListCell head></StructuredListCell>
			<StructuredListCell head>Teilnehmer</StructuredListCell>
		</StructuredListRow>
	</StructuredListHead>
	<StructuredListBody>
		{#each entities as entity }
      {#if entity.error}
        <StructuredListRow>
            <StructuredListCell>
            </StructuredListCell>
            <StructuredListCell>
                <div>{entity.iss}</div>
                <div><CloseFilled fill="red"/> {entity.error.error}</div>
            </StructuredListCell>
        </StructuredListRow>
      {:else}
			<StructuredListRow on:click={() => openEntity(entity)}>
                <StructuredListCell class="logoCell">
                    {#if logo(entity)}
                    <img class="logo" src={logo(entity)} alt="Logo"/>
                    {/if}
                </StructuredListCell>
				        <StructuredListCell>
                    {#if entity.statement?.metadata.federation_entity?.name}
                      <div>{entity.statement?.metadata.federation_entity?.name}</div>
                    {/if}
                    <div>{entity.statement?.iss}</div>
                </StructuredListCell>
			</StructuredListRow>
      {/if}
		{/each}
	</StructuredListBody>
</StructuredList>
