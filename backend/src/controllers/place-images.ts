import { Request, Response } from 'express';
import * as placeImagesService from '../services/place-images.js';

export async function addImage(req: Request, res: Response): Promise<void> {
	try {
		const { id: placeId } = req.params;
		const file = req.file;

		if (!file) {
			res.status(400).json({ data: null, error: 'No image file provided' });
			return;
		}

		const caption = req.body.caption || null;
		const sortOrder = Number(req.body.sort_order ?? 0);

		const image = await placeImagesService.addImage(
			placeId,
			{ buffer: file.buffer, mimetype: file.mimetype, originalname: file.originalname },
			caption,
			sortOrder,
			req.user!.id
		);

		res.status(201).json({ data: image, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function getImages(req: Request, res: Response): Promise<void> {
	try {
		const { id: placeId } = req.params;
		const images = await placeImagesService.getImagesForPlace(placeId);
		res.json({ data: images, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function deleteImage(req: Request, res: Response): Promise<void> {
	try {
		const { imageId } = req.params;

		const owner = await placeImagesService.getImageOwner(imageId);
		if (owner && owner !== req.user!.id && req.user!.role !== 'admin') {
			res.status(403).json({ data: null, error: 'Not authorised to delete this image' });
			return;
		}

		await placeImagesService.deleteImage(imageId);
		res.status(204).send();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function updateSortOrder(req: Request, res: Response): Promise<void> {
	try {
		const { imageId } = req.params;
		const { sort_order } = req.body as { sort_order?: number };

		if (sort_order === undefined) {
			res.status(400).json({ data: null, error: 'Missing sort_order' });
			return;
		}

		const image = await placeImagesService.updateSortOrder(imageId, sort_order);
		res.json({ data: image, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
