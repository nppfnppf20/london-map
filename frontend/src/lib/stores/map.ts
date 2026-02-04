import { writable, get } from 'svelte/store';
import type { MapState } from '$types';

const LONDON_CENTER: [number, number] = [51.5074, -0.1278];
const DEFAULT_ZOOM = 13;

interface MapStoreState extends MapState {
	flyToTrigger: number; // Incremented to trigger a fly-to animation
}

const initialState: MapStoreState = {
	center: LONDON_CENTER,
	zoom: DEFAULT_ZOOM,
	flyToTrigger: 0
};

function createMapStore() {
	const { subscribe, set, update } = writable<MapStoreState>(initialState);

	return {
		subscribe,
		setCenter: (center: [number, number]) => update(state => ({ ...state, center })),
		setZoom: (zoom: number) => update(state => ({ ...state, zoom })),
		// Use this to programmatically fly to a location
		flyTo: (center: [number, number], zoom?: number) => update(state => ({
			...state,
			center,
			zoom: zoom ?? state.zoom,
			flyToTrigger: state.flyToTrigger + 1
		})),
		reset: () => set(initialState)
	};
}

export const mapStore = createMapStore();
