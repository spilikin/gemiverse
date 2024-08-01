<script lang="ts">
    import { CodeSnippet } from "carbon-components-svelte";

    export let content: object;
    
    export function toPrettyJSON(c: object){
        return JSON.stringify(c, null, 2);
    }
</script>
<CodeSnippet type="multi" light={true} expanded>{toPrettyJSON(content)}</CodeSnippet>