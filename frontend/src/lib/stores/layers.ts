import { writable } from 'svelte/store';
import { ROUTE_COLORS } from '$utils/map-helpers';
import type { LayerState } from '$types';

// Build initial state from ROUTE_COLORS — all routes visible by default
const initialState: LayerState = Object.fromEntries(
	Object.keys(ROUTE_COLORS).map(route => [route, true])
);

function createLayerStore() {
	const { subscribe, update } = writable<LayerState>(initialState);

	return {
		subscribe,
		toggle: (route: string) => update(state => ({
			...state,
			[route]: !state[route]
		})),
		setLayer: (route: string, visible: boolean) => update(state => ({
			...state,
			[route]: visible
		})),
		showAll: () => update(state => {
			const next: LayerState = {};
			for (const key of Object.keys(state)) {
				next[key] = true;
			}
			return next;
		}),
		hideAll: () => update(state => {
			const next: LayerState = {};
			for (const key of Object.keys(state)) {
				next[key] = false;
			}
			return next;
		})
	};
}

export const layerStore = createLayerStore();
