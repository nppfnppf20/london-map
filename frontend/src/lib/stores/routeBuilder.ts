import { writable, get } from 'svelte/store';
import { placesApi } from '$services/api';
import { placesStore } from '$stores/places';

interface RouteBuilderState {
	active: boolean;
	routeName: string;
	color: string;
	stops: string[];  // ordered place IDs
}

const initialState: RouteBuilderState = {
	active: false,
	routeName: '',
	color: '',
	stops: []
};

function createRouteBuilderStore() {
	const { subscribe, set, update } = writable<RouteBuilderState>(initialState);

	return {
		subscribe,

		start(routeName: string, color: string) {
			set({
				active: true,
				routeName,
				color,
				stops: []
			});
		},

		async addStop(placeId: string): Promise<boolean> {
			const state = get({ subscribe });

			// Don't add duplicates
			if (state.stops.includes(placeId)) return false;

			const stopNumber = state.stops.length + 1;

			try {
				await placesApi.update(placeId, {
					route: state.routeName,
					tour_stop: stopNumber
				});

				update(s => ({
					...s,
					stops: [...s.stops, placeId]
				}));

				// Refresh places so the map picks up the change
				await placesStore.fetchAll();
				return true;
			} catch {
				return false;
			}
		},

		async undoLast(): Promise<boolean> {
			const state = get({ subscribe });
			if (state.stops.length === 0) return false;

			const lastId = state.stops[state.stops.length - 1];

			try {
				await placesApi.update(lastId, {
					route: null,
					tour_stop: null
				});

				update(s => ({
					...s,
					stops: s.stops.slice(0, -1)
				}));

				await placesStore.fetchAll();
				return true;
			} catch {
				return false;
			}
		},

		finish() {
			set(initialState);
		},

		async cancel(): Promise<void> {
			const state = get({ subscribe });

			// Undo all stops that were set
			for (const placeId of state.stops) {
				try {
					await placesApi.update(placeId, {
						route: undefined,
						tour_stop: undefined
					});
				} catch {
					// best effort
				}
			}

			await placesStore.fetchAll();
			set(initialState);
		}
	};
}

export const routeBuilder = createRouteBuilderStore();
