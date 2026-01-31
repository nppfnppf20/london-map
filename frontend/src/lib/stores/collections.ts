import { writable } from 'svelte/store';
import { collectionsApi } from '$services/api';
import type { Collection } from '$types';

interface CollectionsState {
	collections: Collection[];
	loading: boolean;
	error: string | null;
}

const initialState: CollectionsState = {
	collections: [],
	loading: false,
	error: null
};

function createCollectionsStore() {
	const { subscribe, update } = writable<CollectionsState>(initialState);

	return {
		subscribe,

		async fetchAll(): Promise<void> {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const collections = await collectionsApi.getAll();
				update(state => ({ ...state, collections, loading: false }));
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to fetch collections';
				update(state => ({ ...state, error: message, loading: false }));
			}
		}
	};
}

export const collectionsStore = createCollectionsStore();
