import { Request, Response } from 'express';
import * as placesService from '../services/places.js';
import type {
	Category,
	CreatePlaceDto,
	UpdatePlaceDto,
	NearbyMode,
	NearbyPlacesQuery,
	AlongRoutePlacesQuery,
	RouteSearchMode
} from '../types/index.js';

function parseList(value: unknown): string[] {
	if (!value) return [];
	if (Array.isArray(value)) {
		return value.flatMap(entry => String(entry).split(',')).map(item => item.trim()).filter(Boolean);
	}
	return String(value)
		.split(',')
		.map(item => item.trim())
		.filter(Boolean);
}

export async function getAll(req: Request, res: Response): Promise<void> {
	try {
		const category = req.query.category as Category | undefined;
		const places = await placesService.getAllPlaces(category, req.user?.id);
		res.json({ data: places, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function getById(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const place = await placesService.getPlaceById(id, req.user?.id);

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

		const place = await placesService.createPlace(dto, req.user!.id);
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

		const owner = await placesService.getPlaceOwner(id);
		if (owner && owner !== req.user!.id && req.user!.role !== 'admin') {
			res.status(403).json({ data: null, error: 'Not authorised to edit this place' });
			return;
		}

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

export async function addCollections(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;
		const { collection_ids } = req.body as { collection_ids?: string[] };

		if (!collection_ids || !Array.isArray(collection_ids) || collection_ids.length === 0) {
			res.status(400).json({ data: null, error: 'Missing collection_ids' });
			return;
		}

		await placesService.addCollectionsToPlace(id, collection_ids);
		res.status(204).send();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
export async function remove(req: Request, res: Response): Promise<void> {
	try {
		const { id } = req.params;

		const owner = await placesService.getPlaceOwner(id);
		if (owner && owner !== req.user!.id && req.user!.role !== 'admin') {
			res.status(403).json({ data: null, error: 'Not authorised to delete this place' });
			return;
		}

		await placesService.deletePlace(id);
		res.status(204).send();
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function getNearby(req: Request, res: Response): Promise<void> {
	try {
		const lat = Number(req.query.lat);
		const lng = Number(req.query.lng);
		const radiusMeters = Number(req.query.radius_meters ?? req.query.radius);
		const mode = req.query.mode as NearbyMode | undefined;

		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			res.status(400).json({ data: null, error: 'Missing or invalid lat/lng' });
			return;
		}

		if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
			res.status(400).json({ data: null, error: 'Missing or invalid radius_meters' });
			return;
		}

		if (!mode || !['sites', 'routes', 'collections'].includes(mode)) {
			res.status(400).json({ data: null, error: 'Missing or invalid mode' });
			return;
		}

		const categories = parseList(req.query.categories) as Category[];
		const routes = parseList(req.query.routes);
		const collectionIds = parseList(req.query.collection_ids ?? req.query.collections);

		if (mode === 'collections' && collectionIds.length === 0) {
			res.status(400).json({ data: null, error: 'Missing collection_ids' });
			return;
		}

		const query: NearbyPlacesQuery = {
			latitude: lat,
			longitude: lng,
			radiusMeters,
			mode,
			categories: categories.length > 0 ? categories : undefined,
			routes: routes.length > 0 ? routes : undefined,
			collectionIds: collectionIds.length > 0 ? collectionIds : undefined
		};

		const places = await placesService.getNearbyPlaces(query);
		res.json({ data: places, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function getAlongRoute(req: Request, res: Response): Promise<void> {
	try {
		const { line, width_meters, mode, categories, routes, collection_ids } = req.body as {
			line?: [number, number][];
			width_meters?: number;
			mode?: RouteSearchMode;
			categories?: Category[];
			routes?: string[];
			collection_ids?: string[];
		};

		const widthMeters = Number(width_meters);

		if (!Array.isArray(line) || line.length < 2) {
			res.status(400).json({ data: null, error: 'Missing or invalid line' });
			return;
		}

		if (!Number.isFinite(widthMeters) || widthMeters <= 0) {
			res.status(400).json({ data: null, error: 'Missing or invalid width_meters' });
			return;
		}

		if (!mode || !['sites', 'routes', 'collections'].includes(mode)) {
			res.status(400).json({ data: null, error: 'Missing or invalid mode' });
			return;
		}

		if (mode === 'collections' && (!collection_ids || collection_ids.length === 0)) {
			res.status(400).json({ data: null, error: 'Missing collection_ids' });
			return;
		}

		const query: AlongRoutePlacesQuery = {
			line,
			widthMeters,
			mode,
			categories: categories && categories.length > 0 ? categories : undefined,
			routes: routes && routes.length > 0 ? routes : undefined,
			collectionIds: collection_ids && collection_ids.length > 0 ? collection_ids : undefined
		};

		const places = await placesService.getAlongRoutePlaces(query);
		res.json({ data: places, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
