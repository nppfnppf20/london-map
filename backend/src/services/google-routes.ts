import { config } from '../config/index.js';

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
