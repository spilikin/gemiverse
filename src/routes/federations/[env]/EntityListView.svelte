<script lang="ts">	
    import { type Entity, encodeEntityIdentifier } from '$lib/federations';
    import { goto } from '$app/navigation';
    export let env = '';
    export let entities: Entity[] = [];
    import {
      StructuredList,
      StructuredListHead,
      StructuredListBody,
      StructuredListRow,
      StructuredListCell,
      Tag,
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
        goto(`/federations/${env}/entities/${encodeEntityIdentifier(entity.statement!)}`)
    }
</script>

<style>
    :global(.logoCell) {
        width: 95px;
    }

</style>

<StructuredList selection>
	<StructuredListHead>
		<StructuredListRow head>
			<StructuredListCell head>Typ</StructuredListCell>
			<StructuredListCell head>Teilnehmer</StructuredListCell>
		</StructuredListRow>
	</StructuredListHead>
	<StructuredListBody>
		{#each entities as entity }
      {#if entity.error}
        <StructuredListRow>
            <StructuredListCell>
                <Tag type="red">Error</Tag>
            </StructuredListCell>
            <StructuredListCell>
                <div>{entity.iss}</div>
                <div><CloseFilled fill="red"/> {entity.error.error_description}</div>
            </StructuredListCell>
        </StructuredListRow>
      {:else}
			<StructuredListRow on:click={() => openEntity(entity)}>
                <StructuredListCell class="logoCell">
                    <!--
                    {#if logo(entity)}
                    <img src={logo(entity)} alt="Logo" class="logo"/>
                    {/if}
                    -->
                    {#if entity.type === 'openid_provider'}
                        <Tag type="green">IDP</Tag>
                    {:else}
                        <Tag type="blue">RP</Tag>
                    {/if}
                </StructuredListCell>
				        <StructuredListCell>
                    {#if entity.type === 'openid_provider'}
                        <div>{entity.statement?.metadata.federation_entity?.name}</div>
                    {:else}
                        <div>{entity.statement?.metadata.openid_relying_party?.client_name}</div>
                    {/if}
                    <div>{entity.iss}</div>
                </StructuredListCell>
			</StructuredListRow>
      {/if}
		{/each}
	</StructuredListBody>
</StructuredList>
