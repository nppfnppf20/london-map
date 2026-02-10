import { getSupabaseClient } from './supabase.js';
import type { Beacon, CreateBeaconDto } from '../types/index.js';

const TABLE_NAME = 'beacons';

export async function createBeacon(dto: CreateBeaconDto, userId: string | null): Promise<Beacon> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.insert({
			creator_name: dto.creator_name,
			creator_lat: dto.creator_lat,
			creator_lng: dto.creator_lng,
			categories: dto.categories,
			image_path: dto.image_path || null,
			created_by: userId
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create beacon: ${error.message}`);
	}

	return data;
}

export async function resolveBeacon(token: string): Promise<Beacon | null> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.select('*')
		.eq('token', token)
		.single();

	if (error) {
		if (error.code === 'PGRST116') return null;
		throw new Error(`Failed to resolve beacon: ${error.message}`);
	}

	return data;
}

export async function addParticipant(
	token: string,
	participant: { name: string; lat: number; lng: number }
): Promise<Beacon | null> {
	const supabase = getSupabaseClient();

	const { data: beacon, error: fetchError } = await supabase
		.from(TABLE_NAME)
		.select('*')
		.eq('token', token)
		.single();

	if (fetchError) {
		if (fetchError.code === 'PGRST116') return null;
		throw new Error(`Failed to find beacon: ${fetchError.message}`);
	}

	const participants = beacon.participants || [];
	participants.push({ ...participant, joined_at: new Date().toISOString() });

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.update({ participants })
		.eq('token', token)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to add participant: ${error.message}`);
	}

	return data;
}
