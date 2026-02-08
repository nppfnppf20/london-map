import { getSupabaseClient } from './supabase.js';
import type { Profile } from '../types/index.js';

export async function getProfile(userId: string): Promise<Profile | null> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', userId)
		.single();

	if (error || !data) return null;
	return data as Profile;
}

export async function updateProfile(
	userId: string,
	updates: { username?: string; avatar_url?: string }
): Promise<Profile | null> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from('profiles')
		.update(updates)
		.eq('id', userId)
		.select()
		.single();

	if (error) {
		if (error.code === '23505') {
			throw new Error('Username already taken');
		}
		throw error;
	}

	return data as Profile;
}
