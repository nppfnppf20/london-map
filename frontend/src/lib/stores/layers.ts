import { writable, get } from 'svelte/store';
import { routesStore } from '$stores/routes';
import { collectionsStore } from '$stores/collections';
import type { LayerState, Category, ViewMode } from '$types';

function buildRouteToggles() {
	const routes = get(routesStore);
	const routeToggles: Record<string, boolean> = {};
	for (const name of Object.keys(routes)) {
		routeToggles[name] = false;
	}
	return routeToggles;
}

function buildCollectionToggles() {
	const { collections } = get(collectionsStore);
	const collectionToggles: Record<string, boolean> = {};
	for (const collection of collections) {
		collectionToggles[collection.id] = false;
	}
	return collectionToggles;
}

function buildState(): LayerState {
	const routeToggles = buildRouteToggles();
	const collectionToggles = buildCollectionToggles();

	return {
		viewMode: 'sites',
		sites: {
			history: false,
			architecture: false,
			food: false,
			pub: false
		},
		routes: routeToggles,
		collections: collectionToggles
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

	collectionsStore.subscribe(collectionsState => {
		update(state => {
			const next = { ...state, collections: { ...state.collections } };
			for (const collection of collectionsState.collections) {
				if (next.collections[collection.id] === undefined) {
					next.collections[collection.id] = false;
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
				routes: buildRouteToggles(),
				collections: buildCollectionToggles()
			})),
		showAllSites: () =>
			update(state => ({
				...state,
				viewMode: 'sites',
				sites: {
					history: true,
					architecture: true,
					food: true,
					pub: true
				},
				routes: buildRouteToggles(),
				collections: buildCollectionToggles()
			})),
		showAllCollections: () => {
			const { collections } = get(collectionsStore);
			const allOn: Record<string, boolean> = {};
			for (const c of collections) {
				allOn[c.id] = true;
			}
			update(state => ({
				...state,
				viewMode: 'collections',
				sites: { history: false, architecture: false, food: false, pub: false },
				routes: buildRouteToggles(),
				collections: allOn
			}));
		},
		showAllRoutes: () => {
			const routes = get(routesStore);
			const allOn: Record<string, boolean> = {};
			for (const name of Object.keys(routes)) {
				allOn[name] = true;
			}
			update(state => ({
				...state,
				viewMode: 'routes',
				sites: { history: false, architecture: false, food: false, pub: false },
				routes: allOn,
				collections: buildCollectionToggles()
			}));
		},
		toggleSite: (category: Category) => update(state => ({
			...state,
			sites: { ...state.sites, [category]: !state.sites[category] }
		})),
		toggleRoute: (route: string) => update(state => ({
			...state,
			routes: { ...state.routes, [route]: !state.routes[route] }
		})),
		toggleCollection: (collectionId: string) => update(state => ({
			...state,
			collections: { ...state.collections, [collectionId]: !state.collections[collectionId] }
		}))
	};
}

export const layerStore = createLayerStore();
