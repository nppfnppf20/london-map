import { Request, Response } from 'express';
import * as beaconsService from '../services/beacons.js';
import { getTransitTimesForParticipants } from '../services/google-routes.js';
import type { CreateBeaconDto, MidpointResult } from '../types/index.js';

export async function create(req: Request, res: Response): Promise<void> {
	try {
		const dto: CreateBeaconDto = req.body;

		if (!dto.creator_name || dto.creator_lat == null || dto.creator_lng == null || !dto.categories?.length) {
			res.status(400).json({ data: null, error: 'Missing required fields: creator_name, creator_lat, creator_lng, categories' });
			return;
		}

		const userId = req.user?.id || null;
		const beacon = await beaconsService.createBeacon(dto, userId);
		res.status(201).json({ data: beacon, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function resolve(req: Request, res: Response): Promise<void> {
	try {
		const { token } = req.params;
		const beacon = await beaconsService.resolveBeacon(token);

		if (!beacon) {
			res.status(404).json({ data: null, error: 'Beacon not found' });
			return;
		}

		res.json({ data: beacon, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function join(req: Request, res: Response): Promise<void> {
	try {
		const { token } = req.params;
		const { name, lat, lng } = req.body;

		if (!name || lat == null || lng == null) {
			res.status(400).json({ data: null, error: 'Missing required fields: name, lat, lng' });
			return;
		}

		const beacon = await beaconsService.addParticipant(token, { name, lat, lng });

		if (!beacon) {
			res.status(404).json({ data: null, error: 'Beacon not found' });
			return;
		}

		res.json({ data: beacon, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}

export async function midpoint(req: Request, res: Response): Promise<void> {
	try {
		const { token } = req.params;
		const beacon = await beaconsService.resolveBeacon(token);

		if (!beacon) {
			res.status(404).json({ data: null, error: 'Beacon not found' });
			return;
		}

		const allPeople = [
			{ name: beacon.creator_name, lat: beacon.creator_lat, lng: beacon.creator_lng },
			...beacon.participants
		];

		const midLat = allPeople.reduce((sum, p) => sum + p.lat, 0) / allPeople.length;
		const midLng = allPeople.reduce((sum, p) => sum + p.lng, 0) / allPeople.length;
		const destination = { lat: midLat, lng: midLng };

		const transitTimes = await getTransitTimesForParticipants(allPeople, destination);

		const validTimes = transitTimes.filter(t => t.durationSeconds >= 0);
		let fairnessScore = 0;
		if (validTimes.length >= 2) {
			const durations = validTimes.map(t => t.durationSeconds);
			fairnessScore = Math.max(...durations) - Math.min(...durations);
		}

		const result: MidpointResult = {
			midpoint: destination,
			travelTimes: transitTimes.map(t => ({
				name: t.name,
				durationMinutes: t.durationSeconds >= 0 ? Math.round(t.durationSeconds / 60) : -1
			})),
			fairnessScore: Math.round(fairnessScore / 60)
		};

		res.json({ data: result, error: null });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		res.status(500).json({ data: null, error: message });
	}
}
