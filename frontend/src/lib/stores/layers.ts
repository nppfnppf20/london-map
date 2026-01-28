import { writable, get } from 'svelte/store';
import { routesStore } from '$stores/routes';
import type { LayerState, Category } from '$types';

function buildState(): LayerState {
	const routes = get(routesStore);
	const routeToggles: Record<string, boolean> = {};
	for (const name of Object.keys(routes)) {
		routeToggles[name] = false;
	}

	return {
		sites: {
			history: true,
			architecture: true,
			food: true,
			pub: true
		},
		routes: routeToggles
	};
}

function createLayerStore() {
	const { subscribe, update } = writable<LayerState>(buildState());

	// When new routes are added, ensure they appear in the routes section
	routesStore.subscribe(routes => {
		update(state => {
			const next = { ...state, routes: { ...state.routes } };
			for (const name of Object.keys(routes)) {
				if (next.routes[name] === undefined) {
					next.routes[name] = false;
				}
			}
			return next;
		});
	});

	return {
		subscribe,
		toggleSite: (category: Category) => update(state => ({
			...state,
			sites: { ...state.sites, [category]: !state.sites[category] }
		})),
		toggleRoute: (route: string) => update(state => ({
			...state,
			routes: { ...state.routes, [route]: !state.routes[route] }
		}))
	};
}

export const layerStore = createLayerStore();
