import type { Request, Response } from 'express';
import { getDirections, getMultiStopRoute, TravelProfile } from '../services/routing.js';

export async function handleGetDirections(req: Request, res: Response) {
	try {
		const { origin, destination, profile = 'foot-walking' } = req.body;

		if (!origin || !destination) {
			return res.status(400).json({
				data: null,
				error: 'Origin and destination are required'
			});
		}

		if (typeof origin.lat !== 'number' || typeof origin.lng !== 'number') {
			return res.status(400).json({
				data: null,
				error: 'Origin must have lat and lng as numbers'
			});
		}

		if (typeof destination.lat !== 'number' || typeof destination.lng !== 'number') {
			return res.status(400).json({
				data: null,
				error: 'Destination must have lat and lng as numbers'
			});
		}

		const validProfiles: TravelProfile[] = ['foot-walking', 'cycling-regular', 'driving-car'];
		if (!validProfiles.includes(profile)) {
			return res.status(400).json({
				data: null,
				error: `Invalid profile. Must be one of: ${validProfiles.join(', ')}`
			});
		}

		const result = await getDirections(origin, destination, profile);

		res.json({
			data: result,
			error: null
		});
	} catch (error) {
		console.error('Directions error:', error);
		res.status(500).json({
			data: null,
			error: error instanceof Error ? error.message : 'Failed to get directions'
		});
	}
}

export async function handleGetMultiStopRoute(req: Request, res: Response) {
	try {
		const { waypoints, profile = 'foot-walking' } = req.body;

		if (!Array.isArray(waypoints) || waypoints.length < 2) {
			return res.status(400).json({
				data: null,
				error: 'At least 2 waypoints are required'
			});
		}

		for (let i = 0; i < waypoints.length; i++) {
			const wp = waypoints[i];
			if (typeof wp.lat !== 'number' || typeof wp.lng !== 'number') {
				return res.status(400).json({
					data: null,
					error: `Waypoint ${i} must have lat and lng as numbers`
				});
			}
		}

		const validProfiles: TravelProfile[] = ['foot-walking', 'cycling-regular', 'driving-car'];
		if (!validProfiles.includes(profile)) {
			return res.status(400).json({
				data: null,
				error: `Invalid profile. Must be one of: ${validProfiles.join(', ')}`
			});
		}

		const result = await getMultiStopRoute(waypoints, profile);

		res.json({
			data: result,
			error: null
		});
	} catch (error) {
		console.error('Multi-stop route error:', error);
		res.status(500).json({
			data: null,
			error: error instanceof Error ? error.message : 'Failed to get route'
		});
	}
}
