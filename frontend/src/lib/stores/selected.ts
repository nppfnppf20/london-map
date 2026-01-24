import { writable } from 'svelte/store';
import type { Place } from '$types';

function createSelectedStore() {
	const { subscribe, set } = writable<Place | null>(null);

	return {
		subscribe,
		select: (place: Place) => set(place),
		clear: () => set(null)
	};
}

export const selectedPlace = createSelectedStore();
