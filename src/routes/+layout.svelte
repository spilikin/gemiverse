<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import 'carbon-components-svelte/css/all.css';
	import { AppVersion, BuildDate } from '$lib/version';
	import { theme, type Theme } from '$lib/theme.svelte';
	import {
		Header,
		HeaderUtilities,
		HeaderAction,
		HeaderPanelDivider,
		Content,
		SideNav,
		SideNavItems,
		SideNavMenu,
		SideNavMenuItem,
		RadioButtonGroup,
		RadioButton
	} from 'carbon-components-svelte';
	import Settings from 'carbon-icons-svelte/lib/Settings.svelte';

	let { children } = $props();

	let isOpen = $state(false);
	let isSideNavOpen = $state(true);

	function isSelected(path: string): boolean {
		return page.url.pathname.startsWith(path);
	}

	onMount(() => theme.init());
</script>

<svelte:head>
	<title>gematik Universe</title>
</svelte:head>

<Header company="gematik" platformName="Universe" bind:isSideNavOpen>
	<HeaderUtilities>
		<HeaderAction
			bind:isOpen
			aria-label="Settings"
			icon={Settings as unknown as typeof import('svelte').SvelteComponent}
		>
			<div class="settings-panel">
				<section>
					<h4>Appearance</h4>
					<RadioButtonGroup
						legendText="Theme"
						selected={theme.current}
						on:change={(e) => theme.set(e.detail as Theme)}
					>
						<RadioButton labelText="Light" value="g10" />
						<RadioButton labelText="Dark" value="g90" />
					</RadioButtonGroup>
				</section>

				<HeaderPanelDivider />

				<section>
					<h4>About</h4>
					<dl class="meta">
						<dt>Version</dt>
						<dd>{AppVersion}</dd>
						<dt>Built</dt>
						<dd>{BuildDate}</dd>
					</dl>
				</section>
			</div>
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

<style>
	/* Carbon's tab list sizes to its content, so the underline only spans the
	   tabs themselves. Extend a full-width divider under the whole row using
	   Carbon's theme token so the line themes correctly in dark mode too. */
	:global(.bx--tabs) {
		box-shadow: inset 0 -1px 0 var(--bx-border-subtle);
	}

	/* Carbon 1.0-next.1's HeaderAction button no longer carries the bx--btn class,
	   so neither Carbon's own `.bx--btn.bx--btn--icon-only.bx--header__action svg`
	   rule nor an override using that selector ever matches. Target the action
	   button directly and use --bx-icon-primary so the icon themes light/dark. */
	:global(.bx--header__action svg) {
		fill: var(--bx-icon-primary);
	}

	/* Carbon's HeaderPanel defaults to text-secondary on layer background, which
	   reads muddy especially in dark mode. Promote text to primary and widen
	   the panel so the settings UI has room to breathe. */
	:global(.bx--header-panel) {
		color: var(--bx-text-primary);
	}
	:global(.bx--header-panel--expanded) {
		inline-size: 20rem;
	}

	.settings-panel {
		padding: 1rem 1.25rem 1.5rem;
		color: var(--bx-text-primary);
	}

	.settings-panel section {
		padding-block: 0.5rem;
	}

	.settings-panel h4 {
		margin: 0 0 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--bx-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.meta {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: 1rem;
		row-gap: 0.25rem;
		margin: 0;
	}

	.meta dt {
		color: var(--bx-text-secondary);
		font-size: 0.875rem;
	}

	.meta dd {
		margin: 0;
		color: var(--bx-text-primary);
		font-family: var(--bx-code-02-font-family, ui-monospace, monospace);
		font-size: 0.875rem;
	}
</style>
