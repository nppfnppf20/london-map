import { writable, get } from 'svelte/store';
import type { Category, RouteSearchMode, RouteSearchParams } from '$types';
import { placesApi } from '$services/api';
import { placesStore } from '$stores/places';

interface RouteSearchState {
	active: boolean;
	drawing: boolean;
	painting: boolean;
	line: [number, number][];
	widthMeters: number;
	mode: RouteSearchMode;
	categories: Category[];
	routes: string[];
	collectionIds: string[];
	placeIds: string[];
	loading: boolean;
	error: string | null;
}

const initialState: RouteSearchState = {
	active: false,
	drawing: false,
	painting: false,
	line: [],
	widthMeters: 200,
	mode: 'sites',
	categories: [],
	routes: [],
	collectionIds: [],
	placeIds: [],
	loading: false,
	error: null
};

function createRouteSearchStore() {
	const { subscribe, update, set } = writable<RouteSearchState>(initialState);
	const store = { subscribe };

	async function runSearch(params: RouteSearchParams): Promise<boolean> {
		update(state => ({
			...state,
			active: true,
			drawing: false,
			line: params.line,
			widthMeters: params.widthMeters,
			mode: params.mode,
			categories: params.categories ?? [],
			routes: params.routes ?? [],
			collectionIds: params.collectionIds ?? [],
			loading: true,
			error: null
		}));

		try {
			const places = await placesApi.alongRoute(params);
			placesStore.upsertMany(places);
			update(state => ({
				...state,
				placeIds: places.map(place => place.id),
				loading: false
			}));
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to fetch along-route places';
			update(state => ({ ...state, loading: false, error: message }));
			return false;
		}
	}

	return {
		subscribe,
		startDrawing(): void {
			update(state => ({
				...state,
				active: false,
				drawing: true,
				painting: true,
				line: [],
				placeIds: [],
				error: null
			}));
		},
		setLine(line: [number, number][]): void {
			update(state => ({ ...state, line }));
		},
		finishDrawing(): void {
			update(state => ({ ...state, drawing: false, painting: false }));
		},
		togglePainting(): void {
			update(state => ({ ...state, painting: !state.painting }));
		},
		setPainting(painting: boolean): void {
			update(state => ({ ...state, painting }));
		},
		search: runSearch,
		async updateWidth(widthMeters: number): Promise<void> {
			const state = get(store);
			if (!state.active || state.line.length < 2) {
				update(current => ({ ...current, widthMeters }));
				return;
			}

			await runSearch({
				line: state.line,
				widthMeters,
				mode: state.mode,
				categories: state.categories.length ? state.categories : undefined,
				routes: state.routes.length ? state.routes : undefined,
				collectionIds: state.collectionIds.length ? state.collectionIds : undefined
			});
		},
		clear(): void {
			set(initialState);
		}
	};
}

export const routeSearchStore = createRouteSearchStore();
