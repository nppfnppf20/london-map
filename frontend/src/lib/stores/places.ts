import { writable } from 'svelte/store';
import type { Place, PlaceCreateInput } from '$types';
import { placesApi } from '$services/api';

interface PlacesState {
	places: Place[];
	loading: boolean;
	error: string | null;
}

const initialState: PlacesState = {
	places: [],
	loading: false,
	error: null
};

function createPlacesStore() {
	const { subscribe, set, update } = writable<PlacesState>(initialState);

	return {
		subscribe,

		async fetchAll(category?: string): Promise<void> {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const places = await placesApi.getAll(category);
				update(state => ({ ...state, places, loading: false }));
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to fetch places';
				update(state => ({ ...state, error: message, loading: false }));
			}
		},

		async create(place: PlaceCreateInput): Promise<Place | null> {
			try {
				const newPlace = await placesApi.create(place);
				update(state => ({
					...state,
					places: [newPlace, ...state.places]
				}));
				return newPlace;
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to create place';
				update(state => ({ ...state, error: message }));
				return null;
			}
		},

		async remove(id: string): Promise<boolean> {
			try {
				await placesApi.delete(id);
				update(state => ({
					...state,
					places: state.places.filter(p => p.id !== id)
				}));
				return true;
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to delete place';
				update(state => ({ ...state, error: message }));
				return false;
			}
		},

		clearError(): void {
			update(state => ({ ...state, error: null }));
		}
	};
}

export const placesStore = createPlacesStore();
