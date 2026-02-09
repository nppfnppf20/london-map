import { writable } from 'svelte/store';
import { shareLinksApi } from '$services/api';
import type { ResolvedShareLink } from '$types';

interface ShareState {
	active: boolean;
	name: string | null;
	data: ResolvedShareLink | null;
	loading: boolean;
	error: string | null;
}

const initialState: ShareState = {
	active: false,
	name: null,
	data: null,
	loading: false,
	error: null
};

function createShareStore() {
	const { subscribe, set, update } = writable<ShareState>(initialState);

	return {
		subscribe,

		async resolve(token: string): Promise<ResolvedShareLink | null> {
			update(state => ({ ...state, loading: true, error: null }));

			try {
				const data = await shareLinksApi.resolve(token);
				set({
					active: true,
					name: data.name,
					data,
					loading: false,
					error: null
				});
				return data;
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to load shared content';
				set({
					active: false,
					name: null,
					data: null,
					loading: false,
					error: message
				});
				return null;
			}
		},

		clear(): void {
			set(initialState);
		}
	};
}

export const shareStore = createShareStore();
