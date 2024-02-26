<script lang="ts">
	import type { OpenidRelyingParty } from "$lib/federations";

    import {
        StructuredList,
        StructuredListHead,
        StructuredListBody,
        StructuredListRow,
        StructuredListCell,
        CodeSnippet
    } from "carbon-components-svelte";

    export let rp: OpenidRelyingParty
    export let jwk: object | undefined
</script>


<StructuredList>
    <StructuredListHead>
        <StructuredListRow head>
        </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
        <StructuredListRow>
            <StructuredListCell>Typ</StructuredListCell>
            <StructuredListCell head>Relying Party</StructuredListCell>
        </StructuredListRow>
        {#if rp.organization_name}
        <StructuredListRow>
            <StructuredListCell>Organisation</StructuredListCell>
            <StructuredListCell>{rp.organization_name}</StructuredListCell>
        </StructuredListRow>
        {/if}
        <StructuredListRow>
            <StructuredListCell>Client Name</StructuredListCell>
            <StructuredListCell>{rp.client_name}</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
            <StructuredListCell>Redirect URIs</StructuredListCell>
            <StructuredListCell>
                {#each rp.redirect_uris ?? [] as uri}
                    <div>{uri}</div>
                {/each}
            </StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
          <StructuredListCell>Public key</StructuredListCell>
          <StructuredListCell>
              <CodeSnippet type="multi" light={true} expanded>{JSON.stringify(jwk, null, 2)}</CodeSnippet>
          </StructuredListCell>
      </StructuredListRow>

    </StructuredListBody>
</StructuredList>