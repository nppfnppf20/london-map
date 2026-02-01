import { writable, get } from 'svelte/store';
import type { Category, NearbyMode, NearbySearchParams } from '$types';
import { placesApi } from '$services/api';
import { placesStore } from '$stores/places';

interface NearbyState {
	active: boolean;
	center: [number, number] | null;
	radiusMeters: number;
	mode: NearbyMode;
	categories: Category[];
	routes: string[];
	collectionIds: string[];
	placeIds: string[];
	loading: boolean;
	error: string | null;
}

const initialState: NearbyState = {
	active: false,
	center: null,
	radiusMeters: 1000,
	mode: 'sites',
	categories: [],
	routes: [],
	collectionIds: [],
	placeIds: [],
	loading: false,
	error: null
};

function createNearbyStore() {
	const { subscribe, update, set } = writable<NearbyState>(initialState);
	const store = { subscribe };

	async function runSearch(params: NearbySearchParams): Promise<boolean> {
		update(state => ({
			...state,
			active: true,
			center: params.center,
			radiusMeters: params.radiusMeters,
			mode: params.mode,
			categories: params.categories ?? [],
			routes: params.routes ?? [],
			collectionIds: params.collectionIds ?? [],
			loading: true,
			error: null
		}));

		try {
			const places = await placesApi.nearby(params);
			placesStore.upsertMany(places);
			update(state => ({
				...state,
				placeIds: places.map(place => place.id),
				loading: false
			}));
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to fetch nearby places';
			update(state => ({ ...state, loading: false, error: message }));
			return false;
		}
	}

	return {
		subscribe,
		search: runSearch,
		async updateRadius(radiusMeters: number): Promise<void> {
			const state = get(store);
			if (!state.active || !state.center) {
				update(current => ({ ...current, radiusMeters }));
				return;
			}

			await runSearch({
				center: state.center,
				radiusMeters,
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

export const nearbyStore = createNearbyStore();
