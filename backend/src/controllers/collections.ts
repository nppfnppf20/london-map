import { Request, Response } from 'express';
import * as collectionsService from '../services/collections.js';
import type { CreateCollectionDto, UpdateCollectionDto } from '../types/index.js';

export async function getAll(req: Request, res: Response): Promise<void> {
	try {
		const collections = await collectionsService.getAllCollections();
		res.json({ data: collections, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function getById(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const collection = await collectionsService.getCollectionById(id);

		if (!collection) {
			res.status(404).json({ data: null, error: 'Collection not found' });
			return;
		}

		res.json({ data: collection, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function create(req: Request, res: Response): Promise<void> {
	try {
		const dto: CreateCollectionDto = req.body;

		if (!dto.name) {
			res.status(400).json({ data: null, error: 'Missing required fields' });
			return;
		}

		const collection = await collectionsService.createCollection(dto, req.user!.id);
		res.status(201).json({ data: collection, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function update(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const dto: UpdateCollectionDto = req.body;

		const collection = await collectionsService.updateCollection(id, dto);

		if (!collection) {
			res.status(404).json({ data: null, error: 'Collection not found' });
			return;
		}

		res.json({ data: collection, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function remove(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		await collectionsService.deleteCollection(id);
		res.status(204).send();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
