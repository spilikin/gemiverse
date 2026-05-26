import { browser } from '$app/environment';

/**
 * Carbon Components Svelte 1.0 uses a `data-carbon-theme` attribute on the
 * root <html> element to select a theme from `css/all.css`. Carbon's design
 * guide recommends the "productive" pairing for data-dense / functional UIs
 * (vs the harsher "expressive" white/g100 pairing reserved for marketing):
 *
 *   - g10 (#f4f4f4) — light
 *   - g90 (#262626) — dark
 *
 * Productive themes are easier on the eyes for prolonged use and give Carbon
 * room for layer hierarchy (g90 → g80 → g70 for depth on cards/modals/etc.).
 *
 * The attribute is applied as early as possible by an inline script in
 * app.html so the page renders correctly on first paint (no flash). This
 * module mirrors that value into a reactive $state for UI binding and
 * persists changes to localStorage.
 */

const STORAGE_KEY = 'gemiverse:theme';
const ATTR = 'data-carbon-theme';

export type Theme = 'g10' | 'g90';
export const DEFAULT_THEME: Theme = 'g10';

/** Read the stored theme, migrating legacy values ('white'/'g100') from the
 *  earlier expressive pairing to their productive equivalents. */
function readStored(): Theme {
	if (!browser) return DEFAULT_THEME;
	const v = localStorage.getItem(STORAGE_KEY);
	if (v === 'g10' || v === 'g90') return v;
	// Legacy migration: white→g10, g100→g90. Rewrite so we only do this once.
	if (v === 'white') {
		localStorage.setItem(STORAGE_KEY, 'g10');
		return 'g10';
	}
	if (v === 'g100') {
		localStorage.setItem(STORAGE_KEY, 'g90');
		return 'g90';
	}
	return DEFAULT_THEME;
}

class ThemeStore {
	current = $state<Theme>(DEFAULT_THEME);

	/** Call once on app boot to hydrate state from localStorage. */
	init() {
		this.current = readStored();
		this.apply();
	}

	set(next: Theme) {
		this.current = next;
		if (browser) {
			localStorage.setItem(STORAGE_KEY, next);
		}
		this.apply();
	}

	toggle() {
		this.set(this.current === 'g10' ? 'g90' : 'g10');
	}

	private apply() {
		if (!browser) return;
		document.documentElement.setAttribute(ATTR, this.current);
	}
}

export const theme = new ThemeStore();
