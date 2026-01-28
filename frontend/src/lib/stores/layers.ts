import { writable, get } from 'svelte/store';
import { routesStore } from '$stores/routes';
import type { LayerState } from '$types';

function buildState(): LayerState {
	const routes = get(routesStore);
	const state: LayerState = {};
	for (const name of Object.keys(routes)) {
		state[name] = true;
	}
	return state;
}

function createLayerStore() {
	const { subscribe, set, update } = writable<LayerState>(buildState());

	// When routes change, add any new routes as visible layers
	routesStore.subscribe(routes => {
		update(state => {
			const next = { ...state };
			for (const name of Object.keys(routes)) {
				if (next[name] === undefined) {
					next[name] = true;
				}
			}
			return next;
		});
	});

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
