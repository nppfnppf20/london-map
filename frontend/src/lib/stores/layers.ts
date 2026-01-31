import { writable, get } from 'svelte/store';
import { routesStore } from '$stores/routes';
import type { LayerState, Category, ViewMode } from '$types';

function buildRouteToggles() {
	const routes = get(routesStore);
	const routeToggles: Record<string, boolean> = {};
	for (const name of Object.keys(routes)) {
		routeToggles[name] = false;
	}
	return routeToggles;
}

function buildState(): LayerState {
	const routeToggles = buildRouteToggles();

	return {
		viewMode: 'sites',
		sites: {
			history: false,
			architecture: false,
			food: false,
			pub: false
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
		setViewMode: (mode: ViewMode) =>
			update(state => ({
				...state,
				viewMode: mode,
				sites: {
					history: false,
					architecture: false,
					food: false,
					pub: false
				},
				routes: buildRouteToggles()
			})),
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
