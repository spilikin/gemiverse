import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';

/**
 * SvelteKit's vite plugin coerces build.cssMinify to a boolean (kit/src/exports/vite/index.js),
 * which means Vite 8's default lightningcss minifier always wins — and lightningcss chokes on
 * Carbon's range-syntax media queries like `(min-resolution >= 0.001dpcm)`. Force esbuild after
 * SvelteKit's resolver runs.
 */
const forceEsbuildCssMinify = (): Plugin => ({
	name: 'force-esbuild-css-minify',
	enforce: 'post',
	configResolved(config) {
		if (config.build.cssMinify) {
			(config.build as { cssMinify: unknown }).cssMinify = 'esbuild';
		}
		for (const env of Object.values(config.environments)) {
			if (env.build.cssMinify) {
				(env.build as { cssMinify: unknown }).cssMinify = 'esbuild';
			}
		}
	}
});

export default defineConfig({
	plugins: [sveltekit(), forceEsbuildCssMinify()]
});
