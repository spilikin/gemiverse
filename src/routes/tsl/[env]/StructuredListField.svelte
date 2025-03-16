<script lang="ts">
    import { StructuredListRow, StructuredListCell } from "carbon-components-svelte";
    export let label: string;
</script>

<StructuredListRow>
    <StructuredListCell class="icon">
    </StructuredListCell>
    <StructuredListCell class="label">
        {label}
    </StructuredListCell>
    <StructuredListCell class="value">
        <slot></slot>
    </StructuredListCell>
</StructuredListRow>
