import { config } from '../config/index.js';
import type { MidpointStrategy, MidpointResult } from '../types/index.js';

interface LatLng {
	lat: number;
	lng: number;
}

interface TransitResult {
	durationSeconds: number;
}

export async function getTransitTravelTime(origin: LatLng, destination: LatLng): Promise<TransitResult> {
	const apiKey = config.google.routesApiKey;
	if (!apiKey) {
		throw new Error('GOOGLE_ROUTES_API_KEY is not configured');
	}

	const body = {
		origin: {
			location: {
				latLng: { latitude: origin.lat, longitude: origin.lng }
			}
		},
		destination: {
			location: {
				latLng: { latitude: destination.lat, longitude: destination.lng }
			}
		},
		travelMode: 'TRANSIT',
		computeAlternativeRoutes: false
	};

	const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Goog-Api-Key': apiKey,
			'X-Goog-FieldMask': 'routes.duration'
		},
		body: JSON.stringify(body)
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Google Routes API error (${response.status}): ${text}`);
	}

	const data = await response.json();

	if (!data.routes?.length) {
		throw new Error('No transit route found');
	}

	const durationStr = data.routes[0].duration as string; // e.g. "1234s"
	const durationSeconds = parseInt(durationStr.replace('s', ''), 10);

	return { durationSeconds };
}

export async function getTransitTimesForParticipants(
	participants: { name: string; lat: number; lng: number }[],
	destination: LatLng
): Promise<{ name: string; durationSeconds: number }[]> {
	const results = await Promise.all(
		participants.map(async (p) => {
			try {
				const { durationSeconds } = await getTransitTravelTime(
					{ lat: p.lat, lng: p.lng },
					destination
				);
				return { name: p.name, durationSeconds };
			} catch (err) {
				console.error(`Transit time failed for ${p.name}:`, err instanceof Error ? err.message : err);
				return { name: p.name, durationSeconds: -1 };
			}
		})
	);

	return results;
}

export function generateCandidates(people: LatLng[]): LatLng[] {
	const centroid: LatLng = {
		lat: people.reduce((sum, p) => sum + p.lat, 0) / people.length,
		lng: people.reduce((sum, p) => sum + p.lng, 0) / people.length
	};

	const candidates: LatLng[] = [centroid];

	for (const person of people) {
		candidates.push({
			lat: centroid.lat + (person.lat - centroid.lat) * 0.25,
			lng: centroid.lng + (person.lng - centroid.lng) * 0.25
		});
	}

	return candidates;
}

export async function findBestMidpoints(
	people: { name: string; lat: number; lng: number }[]
): Promise<MidpointResult> {
	const candidates = generateCandidates(people);

	const evaluations = await Promise.all(
		candidates.map(async (candidate) => {
			const times = await getTransitTimesForParticipants(people, candidate);
			const validTimes = times.filter(t => t.durationSeconds >= 0);
			const travelTimes = times.map(t => ({
				name: t.name,
				durationMinutes: t.durationSeconds >= 0 ? Math.round(t.durationSeconds / 60) : -1
			}));
			const validMinutes = travelTimes.filter(t => t.durationMinutes >= 0).map(t => t.durationMinutes);
			const totalMinutes = validMinutes.reduce((sum, m) => sum + m, 0);
			const fairnessScore = validMinutes.length >= 2
				? Math.max(...validMinutes) - Math.min(...validMinutes)
				: 0;
			const maxMinutes = validMinutes.length > 0 ? Math.max(...validMinutes) : Infinity;

			return { candidate, travelTimes, totalMinutes, fairnessScore, maxMinutes };
		})
	);

	const validEvals = evaluations.filter(e =>
		e.travelTimes.some(t => t.durationMinutes >= 0)
	);

	if (validEvals.length === 0) {
		// Fallback to centroid with empty times
		const centroid = candidates[0];
		const fallbackStrategy: MidpointStrategy = {
			midpoint: centroid,
			travelTimes: people.map(p => ({ name: p.name, durationMinutes: -1 })),
			totalMinutes: 0,
			fairnessScore: 0
		};
		return { strategies: { lowestTotal: fallbackStrategy, fairest: fallbackStrategy } };
	}

	const lowestTotalEval = validEvals.reduce((best, e) =>
		e.totalMinutes < best.totalMinutes ? e : best
	);

	const fairestEval = validEvals.reduce((best, e) =>
		e.maxMinutes < best.maxMinutes ? e : best
	);

	function toStrategy(e: typeof validEvals[0]): MidpointStrategy {
		return {
			midpoint: e.candidate,
			travelTimes: e.travelTimes,
			totalMinutes: e.totalMinutes,
			fairnessScore: e.fairnessScore
		};
	}

	return {
		strategies: {
			lowestTotal: toStrategy(lowestTotalEval),
			fairest: toStrategy(fairestEval)
		}
	};
}
