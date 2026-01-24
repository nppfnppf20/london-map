import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
	if (!supabase) {
		if (!config.supabase.url || !config.supabase.serviceKey) {
			throw new Error('Supabase configuration missing');
		}

		supabase = createClient(config.supabase.url, config.supabase.serviceKey);
	}

	return supabase;
}
