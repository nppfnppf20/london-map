import { writable } from 'svelte/store';
import type { LayerState } from '$types';

const initialState: LayerState = {
	history: true,
	architecture: true,
	food: true,
	pub: true,
	tours: false
};

function createLayerStore() {
	const { subscribe, update } = writable<LayerState>(initialState);

	return {
		subscribe,
		toggle: (layer: keyof LayerState) => update(state => ({
			...state,
			[layer]: !state[layer]
		})),
		setLayer: (layer: keyof LayerState, visible: boolean) => update(state => ({
			...state,
			[layer]: visible
		})),
		showAll: () => update(state => ({
			history: true,
			architecture: true,
			food: true,
			pub: true,
			tours: true
		})),
		hideAll: () => update(state => ({
			history: false,
			architecture: false,
			food: false,
			pub: false,
			tours: false
		}))
	};
}

export const layerStore = createLayerStore();
