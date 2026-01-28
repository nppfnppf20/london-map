import { getSupabaseClient } from './supabase.js';
import type { Place, CreatePlaceDto, UpdatePlaceDto, Category } from '../types/index.js';

const TABLE_NAME = 'places';

export async function getAllPlaces(category?: Category): Promise<Place[]> {
	const supabase = getSupabaseClient();

	let query = supabase.from(TABLE_NAME).select('*');

	if (category) {
		query = query.eq('category', category);
	}

	const { data, error } = await query.order('created_at', { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch places: ${error.message}`);
	}

	return data || [];
}

export async function getPlaceById(id: string): Promise<Place | null> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.select('*')
		.eq('id', id)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			return null;
		}
		throw new Error(`Failed to fetch place: ${error.message}`);
	}

	return data;
}

export async function createPlace(dto: CreatePlaceDto): Promise<Place> {
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
			tags: dto.tags || []
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create place: ${error.message}`);
	}

	return data;
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
	if (dto.tour_stop !== undefined) updateData.tour_stop = dto.tour_stop;
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
