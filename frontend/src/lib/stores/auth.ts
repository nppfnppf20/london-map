import { writable, get } from 'svelte/store';
import { supabase } from '$services/supabase';
import type { AuthState, Role } from '$types';

async function fetchRole(): Promise<Role | undefined> {
	try {
		const { data: { session } } = await supabase.auth.getSession();
		if (!session) return undefined;
		const res = await fetch(
			`${import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api'}/profiles/me`,
			{ headers: { Authorization: `Bearer ${session.access_token}` } }
		);
		if (!res.ok) return undefined;
		const json = await res.json();
		return json.data?.role;
	} catch {
		return undefined;
	}
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		session: null,
		loading: true
	});

	async function setSessionAndRole(session: { user: { id: string; email?: string | null }; access_token: string }) {
		set({
			user: { id: session.user.id, email: session.user.email! },
			session: { access_token: session.access_token },
			loading: false
		});
		const role = await fetchRole();
		if (role) {
			update(state => state.user ? { ...state, user: { ...state.user, role } } : state);
		}
	}

	return {
		subscribe,

		async initialize() {
			const { data: { session } } = await supabase.auth.getSession();

			if (session) {
				await setSessionAndRole(session);
			} else {
				set({ user: null, session: null, loading: false });
			}

			supabase.auth.onAuthStateChange((_event, session) => {
				if (session) {
					setSessionAndRole(session);
				} else {
					set({ user: null, session: null, loading: false });
				}
			});
		},

		async signUp(email: string, password: string, username: string) {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: { username }
				}
			});

			if (error) throw error;
			return data;
		},

		async signIn(email: string, password: string) {
			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			});

			if (error) throw error;
			return data;
		},

		async signInWithGoogle() {
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: 'google',
				options: {
					redirectTo: window.location.origin
				}
			});

			if (error) throw error;
			return data;
		},

		async signOut() {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
		},

		getToken(): string | null {
			const state = get({ subscribe });
			return state.session?.access_token ?? null;
		}
	};
}

export const authStore = createAuthStore();
