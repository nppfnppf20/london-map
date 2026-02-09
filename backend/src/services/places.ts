import { getSupabaseClient } from './supabase.js';
import type {
	Place,
	PlaceImage,
	CreatePlaceDto,
	UpdatePlaceDto,
	Category,
	Collection,
	NearbyPlacesQuery,
	AlongRoutePlacesQuery
} from '../types/index.js';

const TABLE_NAME = 'places';
const PLACE_SELECT = '*, place_collections(collection_id, collections(*)), place_images(*)';

type PlaceRow = Place & {
	place_collections?: { collections: Collection | null }[];
	place_images?: PlaceImage[];
};

function transformPlace(place: PlaceRow): Place {
	const collections = place.place_collections
		?.map(link => link.collections)
		.filter((collection): collection is Collection => Boolean(collection)) || [];

	const images = (place.place_images || [])
		.sort((a, b) => a.sort_order - b.sort_order);

	const { place_collections, place_images, ...rest } = place;
	return { ...rest, collections, images };
}

export async function getAllPlaces(category?: Category): Promise<Place[]> {
	const supabase = getSupabaseClient();

	let query = supabase
		.from(TABLE_NAME)
		.select(PLACE_SELECT);

	if (category) {
		query = query.eq('category', category);
	}

	const { data, error } = await query.order('created_at', { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch places: ${error.message}`);
	}

	return (data || []).map(place => transformPlace(place as PlaceRow));
}

export async function getPlaceById(id: string): Promise<Place | null> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.select(PLACE_SELECT)
		.eq('id', id)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			return null;
		}
		throw new Error(`Failed to fetch place: ${error.message}`);
	}

	return data ? transformPlace(data as PlaceRow) : null;
}

export async function createPlace(dto: CreatePlaceDto, userId: string): Promise<Place> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.insert({
			name: dto.name,
			description: dto.description || null,
			latitude: dto.latitude,
			longitude: dto.longitude,
			category: dto.category,
			priority: dto.priority || null,
			route: dto.route || null,
			route_stop: dto.route_stop || null,
			tags: dto.tags || [],
			created_by: userId
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create place: ${error.message}`);
	}

	if (dto.collection_ids?.length) {
		const { error: linkError } = await supabase
			.from('place_collections')
			.insert(dto.collection_ids.map(collectionId => ({
				place_id: data.id,
				collection_id: collectionId
			})));

		if (linkError) {
			throw new Error(`Failed to link collections: ${linkError.message}`);
		}
	}

	return data;
}

export async function getPlaceOwner(id: string): Promise<string | null> {
	const supabase = getSupabaseClient();
	const { data } = await supabase
		.from(TABLE_NAME)
		.select('created_by')
		.eq('id', id)
		.single();
	return data?.created_by || null;
}

export async function updatePlace(id: string, dto: UpdatePlaceDto): Promise<Place | null> {
	const supabase = getSupabaseClient();

	const updateData: Partial<Place> & { updated_at: string } = {
		updated_at: new Date().toISOString()
	};

	if (dto.name !== undefined) updateData.name = dto.name;
	if (dto.description !== undefined) updateData.description = dto.description;
	if (dto.latitude !== undefined) updateData.latitude = dto.latitude;
	if (dto.longitude !== undefined) updateData.longitude = dto.longitude;
	if (dto.category !== undefined) updateData.category = dto.category;
	if (dto.priority !== undefined) updateData.priority = dto.priority;
	if (dto.route !== undefined) updateData.route = dto.route;
	if (dto.route_stop !== undefined) updateData.route_stop = dto.route_stop;
	if (dto.tags !== undefined) updateData.tags = dto.tags;

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.update(updateData)
		.eq('id', id)
		.select()
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			return null;
		}
		throw new Error(`Failed to update place: ${error.message}`);
	}

	if (dto.collection_ids) {
		const { error: clearError } = await supabase
			.from('place_collections')
			.delete()
			.eq('place_id', id);

		if (clearError) {
			throw new Error(`Failed to clear collections: ${clearError.message}`);
		}

		if (dto.collection_ids.length > 0) {
			const { error: linkError } = await supabase
				.from('place_collections')
				.insert(dto.collection_ids.map(collectionId => ({
					place_id: id,
					collection_id: collectionId
				})));

			if (linkError) {
				throw new Error(`Failed to link collections: ${linkError.message}`);
			}
		}
	}

	return data;
}

export async function deletePlace(id: string): Promise<boolean> {
	const supabase = getSupabaseClient();

	const { error } = await supabase
		.from(TABLE_NAME)
		.delete()
		.eq('id', id);

	if (error) {
		throw new Error(`Failed to delete place: ${error.message}`);
	}

	return true;
}

export async function addCollectionsToPlace(placeId: string, collectionIds: string[]): Promise<void> {
	if (collectionIds.length === 0) return;

	const supabase = getSupabaseClient();

	const { error } = await supabase
		.from('place_collections')
		.upsert(
			collectionIds.map(collectionId => ({
				place_id: placeId,
				collection_id: collectionId
			})),
			{ onConflict: 'place_id,collection_id', ignoreDuplicates: true }
		);

	if (error) {
		throw new Error(`Failed to link collections: ${error.message}`);
	}
}

type NearbyPlaceRow = Place & {
	collections?: Collection[] | null;
};

export async function getNearbyPlaces(query: NearbyPlacesQuery): Promise<Place[]> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.rpc('nearby_places', {
			lat: query.latitude,
			lng: query.longitude,
			radius_meters: query.radiusMeters,
			mode: query.mode,
			categories: query.categories && query.categories.length > 0 ? query.categories : null,
			routes: query.routes && query.routes.length > 0 ? query.routes : null,
			collection_ids: query.collectionIds && query.collectionIds.length > 0 ? query.collectionIds : null
		});

	if (error) {
		throw new Error(`Failed to fetch nearby places: ${error.message}`);
	}

	return (data || []).map((place: any) => {
		const row = place as NearbyPlaceRow;
		return { ...row, collections: row.collections ?? [] };
	});
}

export async function getAlongRoutePlaces(query: AlongRoutePlacesQuery): Promise<Place[]> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.rpc('along_route_places', {
			line: query.line,
			width_meters: query.widthMeters,
			mode: query.mode,
			categories: query.categories && query.categories.length > 0 ? query.categories : null,
			routes: query.routes && query.routes.length > 0 ? query.routes : null,
			collection_ids: query.collectionIds && query.collectionIds.length > 0 ? query.collectionIds : null
		});

	if (error) {
		throw new Error(`Failed to fetch along-route places: ${error.message}`);
	}

	return (data || []).map((place: any) => {
		const row = place as NearbyPlaceRow;
		return { ...row, collections: row.collections ?? [] };
	});
}
