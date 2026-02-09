import { getSupabaseClient } from './supabase.js';
import type { Collection, CreateCollectionDto, UpdateCollectionDto } from '../types/index.js';

const TABLE_NAME = 'collections';

function applyVisibilityFilter(query: any, userId?: string) {
	if (userId) {
		query = query.or(`visibility.eq.public,created_by.eq.${userId}`);
	} else {
		query = query.eq('visibility', 'public');
	}
	return query;
}

export async function getAllCollections(userId?: string): Promise<Collection[]> {
	const supabase = getSupabaseClient();

	let query = supabase
		.from(TABLE_NAME)
		.select('*');

	query = applyVisibilityFilter(query, userId);

	const { data, error } = await query.order('created_at', { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch collections: ${error.message}`);
	}

	return data || [];
}

export async function getCollectionById(id: string, userId?: string): Promise<Collection | null> {
	const supabase = getSupabaseClient();

	let query = supabase
		.from(TABLE_NAME)
		.select('*')
		.eq('id', id);

	query = applyVisibilityFilter(query, userId);

	const { data, error } = await query.single();

	if (error) {
		if (error.code === 'PGRST116') {
			return null;
		}
		throw new Error(`Failed to fetch collection: ${error.message}`);
	}

	return data;
}

export async function createCollection(dto: CreateCollectionDto, userId: string): Promise<Collection> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.insert({
			name: dto.name,
			description: dto.description || null,
			color: dto.color || null,
			created_by: userId
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create collection: ${error.message}`);
	}

	return data;
}

export async function getCollectionOwner(id: string): Promise<string | null> {
	const supabase = getSupabaseClient();
	const { data } = await supabase
		.from(TABLE_NAME)
		.select('created_by')
		.eq('id', id)
		.single();
	return data?.created_by || null;
}

export async function updateCollection(id: string, dto: UpdateCollectionDto): Promise<Collection | null> {
	const supabase = getSupabaseClient();

	const updateData: Partial<Collection> & { updated_at: string } = {
		updated_at: new Date().toISOString()
	};

	if (dto.name !== undefined) updateData.name = dto.name;
	if (dto.description !== undefined) updateData.description = dto.description;
	if (dto.color !== undefined) updateData.color = dto.color;

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
		throw new Error(`Failed to update collection: ${error.message}`);
	}

	return data;
}

export async function deleteCollection(id: string): Promise<boolean> {
	const supabase = getSupabaseClient();

	const { error } = await supabase
		.from(TABLE_NAME)
		.delete()
		.eq('id', id);

	if (error) {
		throw new Error(`Failed to delete collection: ${error.message}`);
	}

	return true;
}
