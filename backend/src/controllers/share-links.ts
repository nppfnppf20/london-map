import { Request, Response } from 'express';
import * as shareLinksService from '../services/share-links.js';
import type { CreateShareLinkDto } from '../types/index.js';

export async function create(req: Request, res: Response): Promise<void> {
	try {
		if (req.user!.role !== 'admin') {
			res.status(403).json({ data: null, error: 'Only admins can create share links' });
			return;
		}

		const dto: CreateShareLinkDto = req.body;

		if (!dto.name) {
			res.status(400).json({ data: null, error: 'Missing required field: name' });
			return;
		}

		const hasResources = (dto.place_ids?.length || 0) + (dto.collection_ids?.length || 0) + (dto.route_names?.length || 0);
		if (!hasResources) {
			res.status(400).json({ data: null, error: 'Must include at least one place, collection, or route' });
			return;
		}

		const link = await shareLinksService.createShareLink(dto, req.user!.id);
		res.status(201).json({ data: link, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function resolve(req: Request, res: Response): Promise<void> {
	try {
		const { token } = req.params;
		const result = await shareLinksService.resolveShareLink(token);

		if (!result) {
			res.status(404).json({ data: null, error: 'Share link not found' });
			return;
		}

		res.json({ data: result, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function getAll(req: Request, res: Response): Promise<void> {
	try {
		if (req.user!.role !== 'admin') {
			res.status(403).json({ data: null, error: 'Only admins can list share links' });
			return;
		}

		const links = await shareLinksService.getShareLinksByUser(req.user!.id);
		res.json({ data: links, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function remove(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		const owner = await shareLinksService.getShareLinkOwner(id);
		if (owner && owner !== req.user!.id && req.user!.role !== 'admin') {
			res.status(403).json({ data: null, error: 'Not authorised to delete this share link' });
			return;
		}

		await shareLinksService.deleteShareLink(id);
		res.status(204).send();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
