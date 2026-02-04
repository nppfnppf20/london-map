import { Request, Response } from 'express';
import * as geocoderService from '../services/geocoder.js';

export async function search(req: Request, res: Response): Promise<void> {
	try {
		const query = req.query.q as string;

		if (!query || query.trim().length < 2) {
			res.status(400).json({ data: null, error: 'Query must be at least 2 characters' });
			return;
		}

		const results = await geocoderService.geocode(query.trim());
		res.json({ data: results, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Geocoding failed';
		res.status(500).json({ data: null, error: message });
	}
}

export async function batch(req: Request, res: Response): Promise<void> {
	try {
		const { places } = req.body;

		if (!Array.isArray(places) || places.length === 0) {
			res.status(400).json({ data: null, error: 'Places array is required' });
			return;
		}

		if (places.length > 20) {
			res.status(400).json({ data: null, error: 'Maximum 20 places per batch' });
			return;
		}

		const results = await geocoderService.batchGeocode(places);
		const data = Object.fromEntries(results);

		res.json({ data, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Batch geocoding failed';
		res.status(500).json({ data: null, error: message });
	}
}

export async function autocomplete(req: Request, res: Response): Promise<void> {
	try {
		const query = req.query.q as string;

		if (!query || query.trim().length < 2) {
			res.status(400).json({ data: null, error: 'Query must be at least 2 characters' });
			return;
		}

		const results = await geocoderService.autocomplete(query.trim());
		res.json({ data: results, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Autocomplete failed';
		res.status(500).json({ data: null, error: message });
	}
}
