<script lang="ts">
	import { type Entity, encodeEntityIdentifier } from '$lib/federations/federations';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		StructuredList,
		StructuredListHead,
		StructuredListBody,
		StructuredListRow,
		StructuredListCell,
		Tag
	} from 'carbon-components-svelte';
	import CloseFilled from 'carbon-icons-svelte/lib/CloseFilled.svelte';

	let { env = '', entities = [] }: { env?: string; entities?: Entity[] } = $props();

	function openEntity(entity: Entity) {
		goto(
			resolve('/federations/[env]/entities/[entityId]', {
				env,
				entityId: encodeEntityIdentifier(entity.statement!)
			})
		);
	}
</script>

<StructuredList selection>
	<StructuredListHead>
		<StructuredListRow head>
			<StructuredListCell head>Typ</StructuredListCell>
			<StructuredListCell head>Teilnehmer</StructuredListCell>
		</StructuredListRow>
	</StructuredListHead>
	<StructuredListBody>
		{#each entities as entity (entity.iss)}
			{#if entity.error}
				<StructuredListRow class="row-not-allowed">
					<StructuredListCell>
						<Tag type="red">Error</Tag>
					</StructuredListCell>
					<StructuredListCell>
						<div>{entity.iss}</div>
						<div>
							<CloseFilled fill="var(--bx-support-error)" />
							{entity.error.error_description}
						</div>
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
							<div>{entity.iss}</div>
						{:else}
							<div>{entity.statement?.metadata.openid_relying_party?.client_name}</div>
							<div>{entity.iss}</div>
							<div><div class="cidi">{entity.cidi}</div></div>
						{/if}
					</StructuredListCell>
				</StructuredListRow>
			{/if}
		{/each}
	</StructuredListBody>
</StructuredList>

<style>
	:global(.logoCell) {
		width: 95px;
	}

	/* Carbon's `selection` StructuredList sets cursor: pointer on every row.
	   Override for rows we render without an on:click handler (error rows) so
	   the cursor reflects that they aren't navigable. */
	:global(.row-not-allowed),
	:global(.row-not-allowed *) {
		cursor: not-allowed;
	}

	.cidi {
		font-size: 0.8em;
		color: var(--bx-text-secondary);
		background-color: var(--bx-layer-01);
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
		display: inline-block;
		padding-right: 0.5em;
		padding-left: 0.5em;
		padding-top: 0.2em;
		padding-bottom: 0.2em;
		border-radius: 15%;
	}
</style>
