import { writable } from 'svelte/store';
import { beaconsApi, placesApi } from '$services/api';
import { placesStore } from '$stores/places';
import type { Beacon, Category } from '$types';

interface BeaconState {
	active: boolean;
	joining: boolean;
	token: string | null;
	beacon: Beacon | null;
	midpoint: [number, number] | null;
	responderName: string;
	placeIds: string[];
	loading: boolean;
	error: string | null;
}

const initialState: BeaconState = {
	active: false,
	joining: false,
	token: null,
	beacon: null,
	midpoint: null,
	responderName: '',
	placeIds: [],
	loading: false,
	error: null
};

function calculateMidpoint(creatorLat: number, creatorLng: number, participants: { lat: number; lng: number }[]): [number, number] {
	const points = [{ lat: creatorLat, lng: creatorLng }, ...participants];
	const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
	const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
	return [lat, lng];
}

function createBeaconStore() {
	const { subscribe, set, update } = writable<BeaconState>(initialState);

	return {
		subscribe,

		async load(token: string): Promise<Beacon | null> {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const beacon = await beaconsApi.resolve(token);
				set({
					...initialState,
					joining: true,
					token,
					beacon,
					loading: false
				});
				return beacon;
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to load beacon';
				set({ ...initialState, loading: false, error: message });
				return null;
			}
		},

		async join(name: string, lat: number, lng: number): Promise<boolean> {
			let currentToken: string | null = null;
			let currentBeacon: Beacon | null = null;

			update(state => {
				currentToken = state.token;
				currentBeacon = state.beacon;
				return { ...state, loading: true, error: null };
			});

			if (!currentToken || !currentBeacon) return false;

			try {
				const beacon = await beaconsApi.join(currentToken, { name, lat, lng });

				const midpoint = calculateMidpoint(
					beacon.creator_lat,
					beacon.creator_lng,
					[...beacon.participants]
				);

				const categories: Category[] = beacon.categories || [];

				const places = await placesApi.nearby({
					center: midpoint,
					radiusMeters: 1000,
					mode: 'sites',
					categories: categories.length > 0 ? categories : undefined
				});

				placesStore.upsertMany(places);

				set({
					active: true,
					joining: false,
					token: currentToken,
					beacon,
					midpoint,
					responderName: name,
					placeIds: places.map(p => p.id),
					loading: false,
					error: null
				});

				return true;
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to join beacon';
				update(state => ({ ...state, loading: false, error: message }));
				return false;
			}
		},

		async resolve(token: string): Promise<Beacon | null> {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const beacon = await beaconsApi.resolve(token);
				const midpoint = calculateMidpoint(
					beacon.creator_lat,
					beacon.creator_lng,
					beacon.participants
				);

				const categories: Category[] = beacon.categories || [];

				const places = await placesApi.nearby({
					center: midpoint,
					radiusMeters: 1000,
					mode: 'sites',
					categories: categories.length > 0 ? categories : undefined
				});

				placesStore.upsertMany(places);

				set({
					active: true,
					joining: false,
					token,
					beacon,
					midpoint,
					responderName: '',
					placeIds: places.map(p => p.id),
					loading: false,
					error: null
				});

				return beacon;
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to load beacon';
				set({ ...initialState, loading: false, error: message });
				return null;
			}
		},

		setResponderName(name: string): void {
			update(state => ({ ...state, responderName: name }));
		},

		clear(): void {
			set(initialState);
		}
	};
}

export const beaconStore = createBeaconStore();
