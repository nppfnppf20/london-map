import { getSupabaseClient } from './supabase.js';
import type { Collection, CreateCollectionDto, UpdateCollectionDto } from '../types/index.js';

const TABLE_NAME = 'collections';

export async function getAllCollections(): Promise<Collection[]> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		throw new Error(`Failed to fetch collections: ${error.message}`);
	}

	return data || [];
}

export async function getCollectionById(id: string): Promise<Collection | null> {
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
		throw new Error(`Failed to fetch collection: ${error.message}`);
	}

	return data;
}

export async function createCollection(dto: CreateCollectionDto): Promise<Collection> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.insert({
			name: dto.name,
			description: dto.description || null,
			color: dto.color || null
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create collection: ${error.message}`);
	}

	return data;
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
