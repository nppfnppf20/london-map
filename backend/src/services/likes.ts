import { getSupabaseClient } from './supabase.js';
import type { LikeStatus, Place } from '../types/index.js';

const TABLE_NAME = 'place_likes';

export async function getLikeStatus(placeId: string, userId?: string): Promise<LikeStatus> {
	const supabase = getSupabaseClient();

	const { count } = await supabase
		.from(TABLE_NAME)
		.select('*', { count: 'exact', head: true })
		.eq('place_id', placeId);

	let liked = false;
	if (userId) {
		const { data } = await supabase
			.from(TABLE_NAME)
			.select('id')
			.eq('place_id', placeId)
			.eq('user_id', userId)
			.maybeSingle();
		liked = !!data;
	}

	return { liked, count: count ?? 0 };
}

export async function toggleLike(placeId: string, userId: string): Promise<LikeStatus> {
	const supabase = getSupabaseClient();

	const { data: existing } = await supabase
		.from(TABLE_NAME)
		.select('id')
		.eq('place_id', placeId)
		.eq('user_id', userId)
		.maybeSingle();

	if (existing) {
		await supabase.from(TABLE_NAME).delete().eq('id', existing.id);
	} else {
		await supabase.from(TABLE_NAME).insert({ place_id: placeId, user_id: userId });
	}

	return getLikeStatus(placeId, userId);
}

export async function getLikedPlaces(userId: string): Promise<Place[]> {
	const supabase = getSupabaseClient();

	const { data: likes, error: likesError } = await supabase
		.from(TABLE_NAME)
		.select('place_id')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	if (likesError) {
		throw new Error(`Failed to fetch liked places: ${likesError.message}`);
	}
	if (!likes || likes.length === 0) return [];

	const placeIds = likes.map((l: { place_id: string }) => l.place_id);

	const { data: places, error: placesError } = await supabase
		.from('places')
		.select('*')
		.in('id', placeIds);

	if (placesError) {
		throw new Error(`Failed to fetch places: ${placesError.message}`);
	}

	// Preserve most-recently-liked order
	const placeMap = new Map((places || []).map((p: Place) => [p.id, p]));
	return placeIds.map((id: string) => placeMap.get(id)).filter(Boolean) as Place[];
}
