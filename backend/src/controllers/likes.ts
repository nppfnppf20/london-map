import { Request, Response } from 'express';
import * as likesService from '../services/likes.js';

export async function getLikeStatus(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const status = await likesService.getLikeStatus(id, req.user?.id);
		res.json({ data: status, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function toggleLike(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const status = await likesService.toggleLike(id, req.user!.id);
		res.json({ data: status, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function getMyLikes(req: Request, res: Response): Promise<void> {
	try {
		const places = await likesService.getLikedPlaces(req.user!.id);
		res.json({ data: places, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
