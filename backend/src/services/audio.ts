import type { Collection } from '../types/index.js';
import { getSupabaseClient } from './supabase.js';
import { config } from '../config/index.js';
import type { Place } from '../types/index.js';

interface AudioProcessResult {
	transcript: string;
	summary: string;
	tags: string[];
	audioUrl: string;
}

function normalizeTags(tags: string[]): string[] {
	const seen = new Set<string>();
	const result: string[] = [];
	for (const tag of tags) {
		const trimmed = tag.trim();
		if (!trimmed) continue;
		const key = trimmed.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(trimmed.toLowerCase());
	}
	return result;
}

async function transcribeAudio(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
	if (!config.openai.apiKey) {
		throw new Error('OpenAI API key missing');
	}

	const form = new FormData();
	form.append('file', new Blob([buffer], { type: mimeType }), filename);
	form.append('model', 'gpt-4o-mini-transcribe');

	const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${config.openai.apiKey}`
		},
		body: form
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Transcription failed: ${text}`);
	}

	const payload = await response.json() as { text?: string };
	if (!payload.text) {
		throw new Error('Transcription missing text');
	}
	return payload.text;
}

async function summarizeTranscript(transcript: string): Promise<{ summary: string; tags: string[] }> {
	if (!config.openai.apiKey) {
		throw new Error('OpenAI API key missing');
	}

	const response = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${config.openai.apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'gpt-4o-mini',
			temperature: 0.2,
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'place_summary',
					strict: true,
					schema: {
						type: 'object',
						properties: {
							summary: { type: 'string' },
							tags: { type: 'array', items: { type: 'string' } }
						},
						required: ['summary', 'tags'],
						additionalProperties: false
					}
				}
			},
			messages: [
				{
					role: 'system',
					content: 'You summarize place descriptions and suggest concise lowercase tags.'
				},
				{
					role: 'user',
					content: `Transcript:\n${transcript}\n\nReturn a 2-4 sentence summary and 5-12 tags.`
				}
			]
		})
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Summary failed: ${text}`);
	}

	const payload = await response.json() as {
		choices?: { message?: { content?: string } }[];
	};

	const content = payload.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error('Summary missing content');
	}

	const parsed = JSON.parse(content) as { summary: string; tags: string[] };
	return {
		summary: parsed.summary.trim(),
		tags: normalizeTags(parsed.tags || [])
	};
}

export async function processPlaceAudio(placeId: string, file: { buffer: Buffer; originalname: string; mimetype: string }, durationSeconds?: number): Promise<Place> {
	const supabase = getSupabaseClient();

	const extension = file.originalname.includes('.')
		? file.originalname.split('.').pop()
		: 'webm';
	const fileName = `${placeId}/${Date.now()}.${extension}`;

	const uploadResult = await supabase.storage
		.from(config.supabase.audioBucket)
		.upload(fileName, file.buffer, {
			contentType: file.mimetype,
			upsert: false
		});

	if (uploadResult.error) {
		throw new Error(`Audio upload failed: ${uploadResult.error.message}`);
	}

	const publicUrl = supabase.storage
		.from(config.supabase.audioBucket)
		.getPublicUrl(fileName).data.publicUrl;

	const transcript = await transcribeAudio(file.buffer, fileName, file.mimetype);
	const { summary, tags } = await summarizeTranscript(transcript);

	const { data: existing, error: placeError } = await supabase
		.from('places')
		.select('description, tags')
		.eq('id', placeId)
		.single();

	if (placeError) {
		throw new Error(`Failed to load place: ${placeError.message}`);
	}

	const existingDescription = existing?.description || '';
	const nextDescription = existingDescription
		? `${existingDescription}\n\n${summary}`
		: summary;

	const mergedTags = normalizeTags([...(existing?.tags || []), ...tags]);

	const { error: updateError } = await supabase
		.from('places')
		.update({
			description: nextDescription,
			tags: mergedTags,
			updated_at: new Date().toISOString()
		})
		.eq('id', placeId);

	if (updateError) {
		throw new Error(`Failed to update place: ${updateError.message}`);
	}

	const { error: audioError } = await supabase
		.from('place_audio')
		.insert({
			place_id: placeId,
			audio_url: publicUrl,
			transcript,
			summary,
			tags: mergedTags,
			duration_seconds: durationSeconds ?? null
		});

	if (audioError) {
		throw new Error(`Failed to record audio: ${audioError.message}`);
	}

	const { data: placeData, error: placeReloadError } = await supabase
		.from('places')
		.select('*, place_collections(collection_id, collections(*))')
		.eq('id', placeId)
		.single();

	if (placeReloadError || !placeData) {
		throw new Error(`Failed to reload place: ${placeReloadError?.message || 'unknown error'}`);
	}

	const collections = (placeData.place_collections || [])
		.map((link: { collections: Collection | null }) => link.collections)
		.filter((collection): collection is Collection => Boolean(collection));

	const { place_collections, ...rest } = placeData;
	return { ...rest, collections } as Place;
}
