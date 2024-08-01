<script lang="ts">
	import type { Federation } from "$lib/federations";
    export let fed: Federation
    import {
        StructuredList,
        StructuredListHead,
        StructuredListBody,
        StructuredListRow,
        StructuredListCell,
        CodeSnippet
    } from "carbon-components-svelte";

    function toPrettyJSON(o: object | undefined) {
        return JSON.stringify(o, null, 2);
    }
</script>

<style>
    :global(.icon) {
        width: 20px;
        height: 20px;
    }
    :global(.label) {
        font-weight: bold;
        width: 200px;
    }
</style>
        

<StructuredList>
    <StructuredListBody>
        <StructuredListRow>
            <StructuredListCell class="icon">
            </StructuredListCell>
            <StructuredListCell class="label">
                Issuer
            </StructuredListCell>
            <StructuredListCell class="value">
                {fed.master.iss}
            </StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
            <StructuredListCell class="icon">
            </StructuredListCell>
            <StructuredListCell class="label">
                Public key
            </StructuredListCell>
            <StructuredListCell class="value">
                <CodeSnippet type="multi" light={true} expanded>{toPrettyJSON(fed.master.jwks?.keys[0])}</CodeSnippet>
            </StructuredListCell>
        </StructuredListRow>
    </StructuredListBody>
</StructuredList>
