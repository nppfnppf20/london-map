import { writable, derived } from 'svelte/store';
import { beaconsApi } from '$services/api';
import { supabase } from '$services/supabase';
import type { Beacon } from '$types';

const STORAGE_KEY = 'beacon_sessions';

interface BeaconSession {
	token: string;
	role: 'creator' | 'joiner';
	name: string;
	beacon: Beacon | null;
}

interface BeaconNotification {
	token: string;
	participantName: string;
	timestamp: string;
}

interface BeaconSessionState {
	sessions: BeaconSession[];
	notifications: BeaconNotification[];
	initialized: boolean;
}

const initialState: BeaconSessionState = {
	sessions: [],
	notifications: [],
	initialized: false
};

function loadTokensFromStorage(): { token: string; role: 'creator' | 'joiner'; name: string }[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

function saveTokensToStorage(sessions: BeaconSession[]) {
	const data = sessions.map(s => ({ token: s.token, role: s.role, name: s.name }));
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createBeaconSessionStore() {
	const { subscribe, set, update } = writable<BeaconSessionState>(initialState);
	const channels = new Map<string, ReturnType<typeof supabase.channel>>();

	function subscribeToRealtime(token: string) {
		if (channels.has(token)) return;

		const channel = supabase
			.channel(`beacon-${token}`)
			.on('postgres_changes', {
				event: 'UPDATE',
				schema: 'public',
				table: 'beacons',
				filter: `token=eq.${token}`
			}, (payload: any) => {
				const oldParticipants = payload.old?.participants || [];
				const newParticipants = payload.new?.participants || [];

				// Update the beacon state in the session
				update(state => {
					const sessions = state.sessions.map(s => {
						if (s.token === token) {
							return { ...s, beacon: { ...s.beacon!, participants: newParticipants } };
						}
						return s;
					});

					const notifications = [...state.notifications];

					if (newParticipants.length > oldParticipants.length) {
						const newJoiner = newParticipants[newParticipants.length - 1];
						if (newJoiner?.name) {
							notifications.push({
								token,
								participantName: newJoiner.name,
								timestamp: new Date().toISOString()
							});
						}
					}

					return { ...state, sessions, notifications };
				});
			})
			.subscribe();

		channels.set(token, channel);
	}

	function unsubscribeFromRealtime(token: string) {
		const channel = channels.get(token);
		if (channel) {
			supabase.removeChannel(channel);
			channels.delete(token);
		}
	}

	return {
		subscribe,

		async init() {
			const stored = loadTokensFromStorage();
			if (stored.length === 0) {
				update(state => ({ ...state, initialized: true }));
				return;
			}

			const sessions: BeaconSession[] = [];

			for (const entry of stored) {
				try {
					const beacon = await beaconsApi.resolve(entry.token);
					sessions.push({ token: entry.token, role: entry.role, name: entry.name, beacon });
					subscribeToRealtime(entry.token);
				} catch {
					// Beacon no longer exists — skip it
				}
			}

			// Clean up storage to only keep valid sessions
			saveTokensToStorage(sessions);

			set({ sessions, notifications: [], initialized: true });
		},

		addSession(token: string, role: 'creator' | 'joiner', name: string, beacon?: Beacon) {
			update(state => {
				// Don't add duplicates
				if (state.sessions.some(s => s.token === token)) return state;

				const session: BeaconSession = { token, role, name, beacon: beacon || null };
				const sessions = [...state.sessions, session];
				saveTokensToStorage(sessions);
				subscribeToRealtime(token);

				return { ...state, sessions };
			});

			// If no beacon was passed, fetch it
			if (!beacon) {
				beaconsApi.resolve(token).then(b => {
					update(state => ({
						...state,
						sessions: state.sessions.map(s =>
							s.token === token ? { ...s, beacon: b } : s
						)
					}));
				}).catch(() => {});
			}
		},

		removeSession(token: string) {
			unsubscribeFromRealtime(token);
			update(state => {
				const sessions = state.sessions.filter(s => s.token !== token);
				const notifications = state.notifications.filter(n => n.token !== token);
				saveTokensToStorage(sessions);
				return { ...state, sessions, notifications };
			});
		},

		clearNotifications() {
			update(state => ({ ...state, notifications: [] }));
		},

		cleanup() {
			for (const token of channels.keys()) {
				unsubscribeFromRealtime(token);
			}
		}
	};
}

export const beaconSessionStore = createBeaconSessionStore();

export const beaconBadgeCount = derived(
	{ subscribe: beaconSessionStore.subscribe },
	($state) => $state.notifications.length
);
