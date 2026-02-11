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

export function generateCandidates(center: LatLng, people: LatLng[]): LatLng[] {
	const candidates: LatLng[] = [center];

	for (const person of people) {
		candidates.push({
			lat: center.lat + (person.lat - center.lat) * 0.25,
			lng: center.lng + (person.lng - center.lng) * 0.25
		});
	}

	return candidates;
}

async function evaluateCandidates(
	candidates: LatLng[],
	people: { name: string; lat: number; lng: number }[]
) {
	const evaluations = await Promise.all(
		candidates.map(async (candidate) => {
			const times = await getTransitTimesForParticipants(people, candidate);
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

	return evaluations.filter(e =>
		e.travelTimes.some(t => t.durationMinutes >= 0)
	);
}

export async function findBestMidpoints(
	people: { name: string; lat: number; lng: number }[]
): Promise<MidpointResult> {
	const centroid: LatLng = {
		lat: people.reduce((sum, p) => sum + p.lat, 0) / people.length,
		lng: people.reduce((sum, p) => sum + p.lng, 0) / people.length
	};

	// Round 1: test the centroid to find who's disadvantaged
	const centroidTimes = await getTransitTimesForParticipants(people, centroid);
	const validCentroidTimes = centroidTimes.filter(t => t.durationSeconds >= 0);

	let shiftedCenter = centroid;

	if (validCentroidTimes.length >= 2) {
		// Find the person with the longest travel time
		const longest = validCentroidTimes.reduce((a, b) =>
			b.durationSeconds > a.durationSeconds ? b : a
		);
		const longestPerson = people.find(p => p.name === longest.name);

		if (longestPerson) {
			// Shift the center 40% toward the most disadvantaged person
			shiftedCenter = {
				lat: centroid.lat + (longestPerson.lat - centroid.lat) * 0.4,
				lng: centroid.lng + (longestPerson.lng - centroid.lng) * 0.4
			};
		}
	}

	// Round 2: generate candidates around the shifted center
	const candidates = generateCandidates(shiftedCenter, people);
	const validEvals = await evaluateCandidates(candidates, people);

	if (validEvals.length === 0) {
		const fallbackStrategy: MidpointStrategy = {
			midpoint: centroid,
			travelTimes: people.map(p => ({ name: p.name, durationMinutes: -1 })),
			totalMinutes: 0,
			fairnessScore: 0
		};
		return { strategies: { lowestTotal: fallbackStrategy, fairest: fallbackStrategy } };
	}

	// Include the centroid from round 1 so lowestTotal can pick it if it's better
	const centroidTravelTimes = centroidTimes.map(t => ({
		name: t.name,
		durationMinutes: t.durationSeconds >= 0 ? Math.round(t.durationSeconds / 60) : -1
	}));
	const centroidValidMinutes = centroidTravelTimes.filter(t => t.durationMinutes >= 0).map(t => t.durationMinutes);
	const centroidEval = centroidValidMinutes.length > 0 ? [{
		candidate: centroid,
		travelTimes: centroidTravelTimes,
		totalMinutes: centroidValidMinutes.reduce((sum, m) => sum + m, 0),
		fairnessScore: centroidValidMinutes.length >= 2
			? Math.max(...centroidValidMinutes) - Math.min(...centroidValidMinutes)
			: 0,
		maxMinutes: Math.max(...centroidValidMinutes)
	}] : [];
	const allEvals = [...validEvals, ...centroidEval];

	const lowestTotalEval = allEvals.reduce((best, e) =>
		e.totalMinutes < best.totalMinutes ? e : best
	);

	const fairestEval = allEvals.reduce((best, e) =>
		e.maxMinutes < best.maxMinutes ? e : best
	);

	function toStrategy(e: typeof allEvals[0]): MidpointStrategy {
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
