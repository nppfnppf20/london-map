import { writable } from 'svelte/store';
import type { MapState } from '$types';

const LONDON_CENTER: [number, number] = [51.5074, -0.1278];
const DEFAULT_ZOOM = 13;

const initialState: MapState = {
	center: LONDON_CENTER,
	zoom: DEFAULT_ZOOM
};

function createMapStore() {
	const { subscribe, set, update } = writable<MapState>(initialState);

	return {
		subscribe,
		setCenter: (center: [number, number]) => update(state => ({ ...state, center })),
		setZoom: (zoom: number) => update(state => ({ ...state, zoom })),
		reset: () => set(initialState)
	};
}

export const mapStore = createMapStore();
