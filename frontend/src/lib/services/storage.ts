import { supabase } from '$services/supabase';

export async function uploadBeaconImage(blob: Blob): Promise<string> {
	const fileName = `${crypto.randomUUID()}.jpg`;
	const filePath = `beacons/${fileName}`;

	const { error } = await supabase.storage
		.from('beacons')
		.upload(filePath, blob, {
			contentType: 'image/jpeg',
			upsert: false
		});

	if (error) {
		throw new Error(`Failed to upload beacon image: ${error.message}`);
	}

	const { data: { publicUrl } } = supabase.storage
		.from('beacons')
		.getPublicUrl(filePath);

	return publicUrl;
}
