<script lang="ts">
    import { CodeSnippet } from "carbon-components-svelte";
export let content: object;
export function toPrettyJSON(){
    return JSON.stringify(content, null, 2);
}
</script>
<CodeSnippet type="multi" light={true} expanded>{toPrettyJSON()}</CodeSnippet>