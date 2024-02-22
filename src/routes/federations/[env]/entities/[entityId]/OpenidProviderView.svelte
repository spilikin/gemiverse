<script lang="ts">
	import type { OpenidProvider } from "$lib/federations";

    import {
        StructuredList,
        StructuredListHead,
        StructuredListBody,
        StructuredListRow,
        StructuredListCell,
        CodeSnippet
    } from "carbon-components-svelte";

    export let op: OpenidProvider
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
            <StructuredListCell head>Identity Provider</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
            <StructuredListCell>Organisation</StructuredListCell>
            <StructuredListCell>{op.organization_name}</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
            <StructuredListCell>Client ID</StructuredListCell>
            <StructuredListCell>{op.issuer}</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
            <StructuredListCell>Pushed Authorization Endpoint</StructuredListCell>
            <StructuredListCell>{op.pushed_authorization_request_endpoint}</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
            <StructuredListCell>Authorization endpoint</StructuredListCell>
            <StructuredListCell>{op.authorization_endpoint}</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
            <StructuredListCell>Token endpoint</StructuredListCell>
            <StructuredListCell>{op.token_endpoint}</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
            <StructuredListCell>Signed JWKS URI</StructuredListCell>
            <StructuredListCell>{op.signed_jwks_uri}</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
            <StructuredListCell>Public key</StructuredListCell>
            <StructuredListCell>
                <CodeSnippet type="multi" light={true} expanded>{JSON.stringify(jwk, null, 2)}</CodeSnippet>
            </StructuredListCell>
        </StructuredListRow>
    </StructuredListBody>
</StructuredList>