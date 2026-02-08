import { writable, get } from 'svelte/store';
import { supabase } from '$services/supabase';
import type { AuthState } from '$types';

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		session: null,
		loading: true
	});

	return {
		subscribe,

		async initialize() {
			const { data: { session } } = await supabase.auth.getSession();

			if (session) {
				set({
					user: { id: session.user.id, email: session.user.email! },
					session: { access_token: session.access_token },
					loading: false
				});
			} else {
				set({ user: null, session: null, loading: false });
			}

			supabase.auth.onAuthStateChange((_event, session) => {
				if (session) {
					set({
						user: { id: session.user.id, email: session.user.email! },
						session: { access_token: session.access_token },
						loading: false
					});
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
