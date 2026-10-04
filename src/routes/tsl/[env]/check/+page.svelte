<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Button,
		FileUploaderDropContainer,
		InlineLoading,
		TextArea
	} from 'carbon-components-svelte';
	import TrustTree from '$lib/components/TrustTree.svelte';
	import CertificateFieldsView from '$lib/components/CertificateFieldsView.svelte';
	import { certificateFields } from '$lib/tsl/tsl_api';
	import type { CheckReport } from '$ti-wasm/types';
	import type { Checker } from '$lib/ti/ti_wasm.client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let checker = $state<Checker | null>(null);
	let failure = $state<string | null>(null);
	let pasted = $state('');
	let results = $state<{ source: string; report?: CheckReport; error?: string }[]>([]);

	async function bytes(path: string): Promise<Uint8Array | undefined> {
		const res = await fetch(path);
		return res.ok ? new Uint8Array(await res.arrayBuffer()) : undefined;
	}

	// The module and the TSL load in the browser only: the check never reaches the server.
	onMount(async () => {
		try {
			const [{ openChecker }, xml, roots] = await Promise.all([
				import('$lib/ti/ti_wasm.client'),
				bytes(`/api/tsl/${data.env}/xml`),
				bytes(`/api/tsl/${data.env}/roots`)
			]);
			if (!xml) throw new Error('the TSL could not be loaded');
			checker = await openChecker(data.env, xml, roots);
		} catch (err) {
			failure = err instanceof Error ? err.message : String(err);
		}
	});

	function check(source: string, input: Uint8Array) {
		if (!checker) return;
		try {
			results = [{ source, report: checker.check(input) }, ...results];
		} catch (err) {
			results = [{ source, error: err instanceof Error ? err.message : String(err) }, ...results];
		}
	}

	async function addFiles(files: readonly File[]) {
		for (const file of files) {
			check(file.name, new Uint8Array(await file.arrayBuffer()));
		}
	}

	function checkPasted() {
		if (pasted.trim()) check('pasted', new TextEncoder().encode(pasted));
	}

	function verdict(report: CheckReport) {
		if (report.result === 'valid') {
			return [report.certificate_type, report.profile && `profile ${report.profile.name}`]
				.filter(Boolean)
				.join(' · ');
		}
		return report.errors[0]?.message ?? 'not valid';
	}
</script>

<p class="note">
	The certificate is checked in your browser against the verified TSL of this environment; it is not
	uploaded. Revocation (OCSP) is not checked.
</p>

{#if failure}
	<p class="bad">The checker could not start: {failure}</p>
{:else if !checker}
	<InlineLoading description="Loading the checker and verifying the TSL…" />
{:else}
	{#if checker.tsl.result !== 'valid'}
		<p class="bad">
			The TSL of this environment is not valid ({checker.tsl.error?.detail}); no certificate can be
			trusted.
		</p>
	{/if}
	<div class="input">
		<FileUploaderDropContainer
			multiple
			labelText="Drop certificates here or click to choose (PEM or DER)"
			on:add={(e) => addFiles(e.detail)}
		/>
		<TextArea
			labelText="Or paste PEM (the end entity first, intermediates after it)"
			rows={4}
			bind:value={pasted}
		/>
		<Button size="sm" kind="secondary" on:click={checkPasted}>Check</Button>
	</div>
{/if}

{#each results as result, i (results.length - i)}
	<section>
		{#if result.report}
			{@const report = result.report}
			<h3>{report.tree[0]?.name ?? result.source}</h3>
			<p class="dim">{result.source}</p>
			<p class:bad={report.result !== 'valid'}>
				{report.result === 'valid' ? 'Valid' : 'Not valid'}: {verdict(report)}
			</p>
			<h4>Trust</h4>
			<TrustTree env={data.env} nodes={report.tree} />
			{#if report.errors.length > 1 || report.warnings.length > 0}
				<h4>Findings</h4>
				{#each report.errors as e, j (j)}
					<p class="bad">{e.message} ({e.code})</p>
				{/each}
				{#each report.warnings as w, j (j)}
					<p>{w.message} ({w.code})</p>
				{/each}
			{/if}
			<h4>Certificate</h4>
			<CertificateFieldsView certificate={certificateFields(report.certificates[0])} />
		{:else}
			<h3>{result.source}</h3>
			<p class="bad">{result.error}</p>
		{/if}
	</section>
{/each}

<style>
	.note {
		margin-bottom: 1rem;
	}
	.input {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: flex-start;
		max-width: 40rem;
	}
	section {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--cds-border-subtle, #e0e0e0);
	}
	h4 {
		margin: 1.5rem 0 0.5rem;
	}
	.dim {
		color: var(--cds-text-secondary, #525252);
	}
	.bad {
		color: var(--cds-support-error, #da1e28);
	}
</style>
