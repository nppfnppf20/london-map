import { Request, Response } from 'express';
import { processPlaceAudio } from '../services/audio.js';

export async function uploadPlaceAudio(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const file = req.file as { buffer: Buffer; originalname: string; mimetype: string } | undefined;
		const durationSeconds = req.body?.duration_seconds ? Number(req.body.duration_seconds) : undefined;

		if (!file) {
			res.status(400).json({ data: null, error: 'Audio file is required' });
			return;
		}

		const place = await processPlaceAudio(id, file, durationSeconds);
		res.json({ data: place, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
