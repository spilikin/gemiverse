<script lang="ts">
	  import type { CertificateInfo, Entity, OpenidRelyingParty } from "$lib/federations";

    import {
        StructuredList,
        StructuredListHead,
        StructuredListBody,
        StructuredListRow,
        StructuredListCell,
        CodeSnippet,
        Tag,
    } from "carbon-components-svelte";
    import ErrorFilled from "carbon-icons-svelte/lib/ErrorFilled.svelte";
    import WarningAltFilled from "carbon-icons-svelte/lib/WarningAltFilled.svelte";
    import CheckmarkFilled from "carbon-icons-svelte/lib/CheckmarkFilled.svelte";

    import HostsView from './HostsView.svelte';

    export let entity: Entity
    export let rp: OpenidRelyingParty

    function notAfter(cert: CertificateInfo) {
        return new Date(cert.notAfter).toISOString().split("T")[0];
    }

    function notAfterState(cert: CertificateInfo) {
        const notAfter = new Date(cert.notAfter);
        const now = new Date();
        const diff = notAfter.getTime() - now.getTime();
        if (diff < 1000 * 60 * 60 * 24 * 7) {
            return "error";
        } else if (diff < 1000 * 60 * 60 * 24 * 30) {
            return "warning";
        } else {
            return "success";
        }
    }

</script>

<style>
  .logo {
      max-height: 64px;
      max-width: 90px;
      vertical-align: middle;
  }
</style>

<StructuredList>
    <StructuredListHead>
        <StructuredListRow head>
        </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
        <StructuredListRow>
          <StructuredListCell head>Entity URI</StructuredListCell>
          <StructuredListCell>{entity.iss}</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
          <StructuredListCell head>Client Name</StructuredListCell>
          <StructuredListCell>{rp.client_name}</StructuredListCell>
        </StructuredListRow>
        {#if rp.organization_name}
        <StructuredListRow>
            <StructuredListCell head>Organisation</StructuredListCell>
            <StructuredListCell>{rp.organization_name}</StructuredListCell>
        </StructuredListRow>
        {/if}
        <StructuredListRow>
          <StructuredListCell head>Logo URI</StructuredListCell>
          <StructuredListCell>{rp.logo_uri}</StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
          <StructuredListCell head>Logo</StructuredListCell>
          <StructuredListCell>
              <img src={rp.logo_uri} alt="Logo" class="logo"/>
          </StructuredListCell>
        </StructuredListRow>
        {#each entity.jwksCertificates || [] as certs, keyNum }
        {#if certs.length > 0}
        <StructuredListRow>
            <StructuredListCell head>Client certificate ({entity.jwks?.keys[keyNum].use})</StructuredListCell>
            <StructuredListCell>
                <div>{certs[0].subject}</div>
                <div>
                    {#if notAfterState(certs[0]) === "error"}
                        <ErrorFilled color="red"/>
                    {:else if notAfterState(certs[0]) === "warning"}
                        <WarningAltFilled color="orange"/>
                    {:else}
                        <CheckmarkFilled color="green"/>
                    {/if}
                    {notAfter(certs[0])}
                </div>
            </StructuredListCell>
        </StructuredListRow>
        {/if}
        {/each}

    </StructuredListBody>
</StructuredList>
<HostsView hosts={entity.hosts || []} />
<StructuredList>
    <StructuredListBody>
        <StructuredListRow>
            <StructuredListCell head>Redirect URIs</StructuredListCell>
            <StructuredListCell>
                {#each rp.redirect_uris ?? [] as uri}
                    <div>{uri}</div>
                {/each}
            </StructuredListCell>
        </StructuredListRow>
        <StructuredListRow>
          <StructuredListCell head>Entity key</StructuredListCell>
          <StructuredListCell>
              <CodeSnippet type="multi" light={true} expanded>{JSON.stringify(entity.statement?.jwks?.keys[0], null, 2)}</CodeSnippet>
          </StructuredListCell>
        </StructuredListRow>
    </StructuredListBody>
</StructuredList>