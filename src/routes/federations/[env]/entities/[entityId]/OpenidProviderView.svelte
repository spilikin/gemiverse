<script lang="ts">
	import type { Entity, OpenidProvider } from '$lib/federations/federations';

	import {
		StructuredList,
		StructuredListHead,
		StructuredListBody,
		StructuredListRow,
		StructuredListCell,
		CodeSnippet
	} from 'carbon-components-svelte';
	import HostsView from './HostsView.svelte';

	let { entity, op }: { entity: Entity; op: OpenidProvider } = $props();
</script>

<StructuredList>
	<StructuredListHead>
		<StructuredListRow head></StructuredListRow>
	</StructuredListHead>
	<StructuredListBody>
		<StructuredListRow>
			<StructuredListCell head>Issuer</StructuredListCell>
			<StructuredListCell>{op.issuer}</StructuredListCell>
		</StructuredListRow>
		<StructuredListRow>
			<StructuredListCell head>Logo URI</StructuredListCell>
			<StructuredListCell>{op.logo_uri}</StructuredListCell>
		</StructuredListRow>
		<StructuredListRow>
			<StructuredListCell head>Logo</StructuredListCell>
			<StructuredListCell>
				<img src={op.logo_uri} alt="Logo" class="logo" />
			</StructuredListCell>
		</StructuredListRow>
		<StructuredListRow>
			<StructuredListCell head>Organisation</StructuredListCell>
			<StructuredListCell>{op.organization_name}</StructuredListCell>
		</StructuredListRow>
	</StructuredListBody>
</StructuredList>
<HostsView hosts={entity.hosts || []} />
<StructuredList>
	<StructuredListBody>
		<StructuredListRow>
			<StructuredListCell head>Pushed Authorization Endpoint</StructuredListCell>
			<StructuredListCell>{op.pushed_authorization_request_endpoint}</StructuredListCell>
		</StructuredListRow>
		<StructuredListRow>
			<StructuredListCell head>Authorization endpoint</StructuredListCell>
			<StructuredListCell>{op.authorization_endpoint}</StructuredListCell>
		</StructuredListRow>
		<StructuredListRow>
			<StructuredListCell head>Token endpoint</StructuredListCell>
			<StructuredListCell>{op.token_endpoint}</StructuredListCell>
		</StructuredListRow>
		<StructuredListRow>
			<StructuredListCell head>Signed JWKS URI</StructuredListCell>
			<StructuredListCell>{op.signed_jwks_uri}</StructuredListCell>
		</StructuredListRow>
		<StructuredListRow>
			<StructuredListCell head>Entity key</StructuredListCell>
			<StructuredListCell>
				<CodeSnippet type="multi" light={true} expanded
					>{JSON.stringify(entity.statement?.jwks?.keys[0], null, 2)}</CodeSnippet
				>
			</StructuredListCell>
		</StructuredListRow>
		<StructuredListRow>
			<StructuredListCell head>Entity protected headers</StructuredListCell>
			<StructuredListCell>
				<CodeSnippet type="multi" light={true} expanded
					>{JSON.stringify(entity.statementProtectedHeaders, null, 2)}</CodeSnippet
				>
			</StructuredListCell>
		</StructuredListRow>
	</StructuredListBody>
</StructuredList>

<style>
	.logo {
		max-height: 64px;
		max-width: 90px;
		vertical-align: middle;
	}
</style>
