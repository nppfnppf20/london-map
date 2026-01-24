import { Request, Response } from 'express';
import * as placesService from '../services/places.js';
import type { Category, CreatePlaceDto, UpdatePlaceDto } from '../types/index.js';

export async function getAll(req: Request, res: Response): Promise<void> {
	try {
		const category = req.query.category as Category | undefined;
		const places = await placesService.getAllPlaces(category);
		res.json({ data: places, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function getById(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const place = await placesService.getPlaceById(id);

		if (!place) {
			res.status(404).json({ data: null, error: 'Place not found' });
			return;
		}

		res.json({ data: place, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function create(req: Request, res: Response): Promise<void> {
	try {
		const dto: CreatePlaceDto = req.body;

		if (!dto.name || !dto.latitude || !dto.longitude || !dto.category) {
			res.status(400).json({ data: null, error: 'Missing required fields' });
			return;
		}

		const place = await placesService.createPlace(dto);
		res.status(201).json({ data: place, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function update(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const dto: UpdatePlaceDto = req.body;

		const place = await placesService.updatePlace(id, dto);

		if (!place) {
			res.status(404).json({ data: null, error: 'Place not found' });
			return;
		}

		res.json({ data: place, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function remove(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		await placesService.deletePlace(id);
		res.status(204).send();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
