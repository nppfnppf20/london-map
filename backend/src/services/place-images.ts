import { getSupabaseClient } from './supabase.js';
import { config } from '../config/index.js';
import type { PlaceImage } from '../types/index.js';
import { randomUUID } from 'crypto';

const TABLE_NAME = 'place_images';
const STORAGE_BUCKET = 'images';

export async function addImage(
	placeId: string,
	file: { buffer: Buffer; mimetype: string; originalname: string },
	caption: string | null,
	sortOrder: number,
	userId: string
): Promise<PlaceImage> {
	const supabase = getSupabaseClient();

	const ext = file.originalname.split('.').pop() || 'jpg';
	const storagePath = `${placeId}/${randomUUID()}.${ext}`;

	const { error: uploadError } = await supabase.storage
		.from(STORAGE_BUCKET)
		.upload(storagePath, file.buffer, {
			contentType: file.mimetype,
			upsert: false
		});

	if (uploadError) {
		throw new Error(`Failed to upload image: ${uploadError.message}`);
	}

	const imagePath = `${config.supabase.url}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.insert({
			place_id: placeId,
			image_path: imagePath,
			caption,
			sort_order: sortOrder,
			created_by: userId
		})
		.select()
		.single();

	if (error) {
		await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
		throw new Error(`Failed to create image record: ${error.message}`);
	}

	return data;
}

export async function getImageOwner(imageId: string): Promise<string | null> {
	const supabase = getSupabaseClient();
	const { data } = await supabase
		.from(TABLE_NAME)
		.select('created_by')
		.eq('id', imageId)
		.single();
	return data?.created_by || null;
}

export async function getImagesForPlace(placeId: string): Promise<PlaceImage[]> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.select('*')
		.eq('place_id', placeId)
		.order('sort_order', { ascending: true });

	if (error) {
		throw new Error(`Failed to fetch images: ${error.message}`);
	}

	return data || [];
}

export async function deleteImage(imageId: string): Promise<void> {
	const supabase = getSupabaseClient();

	const { data: image, error: fetchError } = await supabase
		.from(TABLE_NAME)
		.select('image_path')
		.eq('id', imageId)
		.single();

	if (fetchError) {
		if (fetchError.code === 'PGRST116') return;
		throw new Error(`Failed to fetch image: ${fetchError.message}`);
	}

	const publicPrefix = `${config.supabase.url}/storage/v1/object/public/${STORAGE_BUCKET}/`;
	if (image.image_path.startsWith(publicPrefix)) {
		const storagePath = image.image_path.slice(publicPrefix.length);
		await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
	}

	const { error } = await supabase
		.from(TABLE_NAME)
		.delete()
		.eq('id', imageId);

	if (error) {
		throw new Error(`Failed to delete image: ${error.message}`);
	}
}

export async function updateSortOrder(imageId: string, sortOrder: number): Promise<PlaceImage> {
	const supabase = getSupabaseClient();

	const { data, error } = await supabase
		.from(TABLE_NAME)
		.update({ sort_order: sortOrder })
		.eq('id', imageId)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to update image: ${error.message}`);
	}

	return data;
}
