import { getSupabaseClient } from './supabase.js';
import type { ShareLink, CreateShareLinkDto, ResolvedShareLink } from '../types/index.js';

const TABLE_NAME = 'share_links';

export async function createShareLink(dto: CreateShareLinkDto, userId: string): Promise<ShareLink> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.insert({
			name: dto.name,
			place_ids: dto.place_ids || [],
			collection_ids: dto.collection_ids || [],
			route_ids: dto.route_ids || [],
			created_by: userId
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create share link: ${error.message}`);
	}

	return data;
}

export async function resolveShareLink(token: string): Promise<ResolvedShareLink | null> {
	const supabase = getSupabaseClient();

	const { data: link, error } = await supabase
		.from(TABLE_NAME)
		.select('*')
		.eq('token', token)
		.single();

	if (error) {
		if (error.code === 'PGRST116') return null;
		throw new Error(`Failed to resolve share link: ${error.message}`);
	}

	const result: ResolvedShareLink = {
		name: link.name,
		places: [],
		collections: [],
		routes: []
	};

	if (link.place_ids?.length) {
		const { data: places } = await supabase
			.from('places')
			.select('*, place_images(*)')
			.in('id', link.place_ids);
		result.places = places || [];
	}

	if (link.collection_ids?.length) {
		const { data: collections } = await supabase
			.from('collections')
			.select('*')
			.in('id', link.collection_ids);
		result.collections = collections || [];

		// Also fetch places belonging to those collections
		const { data: collectionPlaces } = await supabase
			.from('place_collections')
			.select('places(*, place_images(*))')
			.in('collection_id', link.collection_ids);

		if (collectionPlaces) {
			const placeMap = new Map(result.places.map(p => [p.id, p]));
			for (const row of collectionPlaces) {
				const place = (row as any).places;
				if (place && !placeMap.has(place.id)) {
					placeMap.set(place.id, place);
					result.places.push(place);
				}
			}
		}
	}

	if (link.route_ids?.length) {
		const { data: routes } = await supabase
			.from('routes')
			.select('*')
			.in('id', link.route_ids);
		result.routes = routes || [];
	}

	return result;
}

export async function getShareLinksByUser(userId: string): Promise<ShareLink[]> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.select('*')
		.eq('created_by', userId)
		.order('created_at', { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch share links: ${error.message}`);
	}

	return data || [];
}

export async function deleteShareLink(id: string): Promise<boolean> {
	const supabase = getSupabaseClient();

	const { error } = await supabase
		.from(TABLE_NAME)
		.delete()
		.eq('id', id);

	if (error) {
		throw new Error(`Failed to delete share link: ${error.message}`);
	}

	return true;
}

export async function getShareLinkOwner(id: string): Promise<string | null> {
	const supabase = getSupabaseClient();
	const { data } = await supabase
		.from(TABLE_NAME)
		.select('created_by')
		.eq('id', id)
		.single();
	return data?.created_by || null;
}
