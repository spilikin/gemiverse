<script lang="ts">
	import { page } from '$app/state';
	import 'carbon-components-svelte/css/all.css';
	import { AppVersion, BuildDate } from '$lib/version';
	import {
		Header,
		HeaderUtilities,
		HeaderAction,
		HeaderPanelLinks,
		HeaderPanelLink,
		Content,
		SideNav,
		SideNavItems,
		SideNavMenu,
		SideNavMenuItem
	} from 'carbon-components-svelte';

	let { children } = $props();

	let isOpen = $state(false);
	let isSideNavOpen = $state(true);

	function isSelected(path: string): boolean {
		return page.url.pathname.startsWith(path);
	}
</script>

<svelte:head>
	<title>gematik Universe</title>
</svelte:head>

<Header company="gematik" platformName="Universe" bind:isSideNavOpen>
	<HeaderUtilities>
		<HeaderAction bind:isOpen>
			<HeaderPanelLinks>
				<HeaderPanelLink href="#">v{AppVersion} {BuildDate}</HeaderPanelLink>
			</HeaderPanelLinks>
		</HeaderAction>
	</HeaderUtilities>
</Header>

<SideNav isOpen={isSideNavOpen}>
	<SideNavItems>
		<SideNavMenu text="Federations" expanded={true}>
			<SideNavMenuItem href="/federations/test" isSelected={isSelected('/federations/test')}
				>Test</SideNavMenuItem
			>
			<SideNavMenuItem href="/federations/ref" isSelected={isSelected('/federations/ref')}
				>Referenz</SideNavMenuItem
			>
			<SideNavMenuItem href="/federations/prod" isSelected={isSelected('/federations/prod')}
				>Produktiv</SideNavMenuItem
			>
		</SideNavMenu>
		<SideNavMenu text="Trusted Lists" expanded={true}>
			<SideNavMenuItem href="/tsl/test" isSelected={isSelected('/tsl/test')}>Test</SideNavMenuItem>
			<SideNavMenuItem href="/tsl/ref" isSelected={isSelected('/tsl/ref')}>Referenz</SideNavMenuItem
			>
			<SideNavMenuItem href="/tsl/prod" isSelected={isSelected('/tsl/prod')}
				>Produktiv</SideNavMenuItem
			>
		</SideNavMenu>
	</SideNavItems>
</SideNav>

<Content>
	{@render children()}
</Content>
