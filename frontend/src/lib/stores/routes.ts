import { writable } from 'svelte/store';

const INITIAL_ROUTES: Record<string, string> = {
	'Holborn Churches Route': '#8b5cf6',
	'Ancient City Tour': '#dc2626',
	'Mayfair Rainy Stroll': '#22c55e',
	'Vienna Walk': '#f59e0b'
};

function createRoutesStore() {
	const { subscribe, update } = writable<Record<string, string>>({ ...INITIAL_ROUTES });

	return {
		subscribe,

		add(name: string, color: string) {
			update(routes => ({ ...routes, [name]: color }));
		},

		remove(name: string) {
			update(routes => {
				const next = { ...routes };
				delete next[name];
				return next;
			});
		}
	};
}

export const routesStore = createRoutesStore();
