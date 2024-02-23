<script type="ts">
    import "carbon-components-svelte/css/white.css";
    import {AppVersion, BuildDate} from "$lib/version";
    import {
      Header,
      HeaderUtilities,
      HeaderAction,
      HeaderPanelLinks,
      HeaderPanelDivider,
      HeaderPanelLink,
      Content,
      SideNav,
      SideNavItems,
      SideNavMenu,
      SideNavMenuItem,
    } from "carbon-components-svelte";
    let isOpen = false;
    let isSideNavOpen = true;
  </script>
  
  <Header company="gematik" platformName="Universe" bind:isSideNavOpen>
    <HeaderUtilities>
      <HeaderAction bind:isOpen>
        <HeaderPanelLinks>
          <HeaderPanelDivider>v{AppVersion} {BuildDate}</HeaderPanelDivider>
        </HeaderPanelLinks>
      </HeaderAction>
    </HeaderUtilities>

  </Header>
  
  <SideNav isOpen={isSideNavOpen}>
    <SideNavItems>
        <SideNavMenu text="Federation" expanded={true}>
            <SideNavMenuItem href="/federations/test">Test</SideNavMenuItem>
            <SideNavMenuItem href="/federations/ref">Referenz</SideNavMenuItem>
            <SideNavMenuItem href="/federations/prod">Produktiv</SideNavMenuItem>
        </SideNavMenu>
       
    </SideNavItems>
  </SideNav>

  <Content>
  <slot></slot>
  </Content>