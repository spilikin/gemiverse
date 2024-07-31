<script lang="ts">
    import type { HostInfo } from "$lib/federations";
    import { parseDistinguishedName } from "$lib/federations";

    import {
        StructuredList,
        StructuredListHead,
        StructuredListBody,
        StructuredListRow,
        StructuredListCell,
        Tag,
    } from "carbon-components-svelte";
    import ErrorFilled from "carbon-icons-svelte/lib/ErrorFilled.svelte";
    import WarningAltFilled from "carbon-icons-svelte/lib/WarningAltFilled.svelte";
    import CheckmarkFilled from "carbon-icons-svelte/lib/CheckmarkFilled.svelte";


    export let hosts: HostInfo[]

    function ca(host: HostInfo) {
        if (host.certificates && host.certificates.length > 0) {
            const issuer = host.certificates[0].issuer;
            // parse distinguished name into map
            return parseDistinguishedName(issuer).get("O")?.join(", ");
        } else {
            return "-";
        }
    }

    function notAfter(host: HostInfo) {
        if (host.certificates && host.certificates.length > 0) {
            // return date only, without time
            return new Date(host.certificates[0].notAfter).toISOString().split("T")[0];
        } else {
            return "-";
        }
    }

    function notAfterState(host: HostInfo): "error" | "warning" | "success" {
        if (host.certificates && host.certificates.length > 0) {
            const notAfter = new Date(host.certificates[0].notAfter);
            const now = new Date();
            const diff = notAfter.getTime() - now.getTime();
            if (diff < 1000 * 60 * 60 * 24 * 7) {
                return "error";
            } else if (diff < 1000 * 60 * 60 * 24 * 30) {
                return "warning";
            } else {
                return "success";
            }
        } else {
            return "error";
        }
    }

    function keyAlg(host: HostInfo) {
        if (host.certificates && host.certificates.length > 0) {
          let cert = host.certificates[0];
          if (cert.keyType == 'EC') {
            if (cert.keyAlg == "prime256v1") {
              return "EC P-256"
            } else if (cert.keyAlg == "secp384r1") {
              return "EC P-384"
            } else if (cert.keyAlg == "secp521r1") {
              return "EC P-521"
            } else {
              return cert.keyAlg
            }
          } else {
            return cert.keyAlg
          }
        } else {
            return "-";
        }
    }
</script>

<style>
</style>

<StructuredList>
    <StructuredListHead>
        <StructuredListRow head>
            <StructuredListCell head>Server certificate</StructuredListCell>
            <StructuredListCell head>Alg</StructuredListCell>
            <StructuredListCell head>CA</StructuredListCell>
            <StructuredListCell head>Gültig bis</StructuredListCell>
        </StructuredListRow>
    </StructuredListHead>
    <StructuredListBody>
      {#each hosts as host}
        <StructuredListRow>
            <StructuredListCell>{host.name}</StructuredListCell>

            <StructuredListCell>
                {#if host.certificates && host.certificates.length > 0}
                    {#if host.certificates[0].keyType == 'EC'}
                      <Tag type="blue">{keyAlg(host)}</Tag>                    
                    {:else}
                      <Tag>{keyAlg(host)}</Tag>
                    {/if}
                {:else}
                    -
                {/if}
            </StructuredListCell>
            <StructuredListCell>{ca(host)}</StructuredListCell>
            <StructuredListCell>
                {#if notAfterState(host) === "error"}
                    <ErrorFilled fill="red"/>
                {:else if notAfterState(host) === "warning"}
                    <WarningAltFilled fill="orange"/>
                {:else}
                    <CheckmarkFilled fill="green"/>
                {/if}
              {notAfter(host)}
            </StructuredListCell>
        </StructuredListRow>
      {/each}
    </StructuredListBody>
</StructuredList>
