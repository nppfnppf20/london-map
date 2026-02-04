import { config } from '../config/index.js';

const ORS_BASE_URL = 'https://api.openrouteservice.org/v2';

export interface RouteCoordinate {
	lat: number;
	lng: number;
}

export interface DirectionsResult {
	geometry: [number, number][]; // [lng, lat] pairs for the polyline
	distance: number; // meters
	duration: number; // seconds
	steps?: DirectionStep[];
}

export interface DirectionStep {
	instruction: string;
	distance: number;
	duration: number;
}

export type TravelProfile = 'foot-walking' | 'cycling-regular' | 'driving-car';

export async function getDirections(
	origin: RouteCoordinate,
	destination: RouteCoordinate,
	profile: TravelProfile = 'foot-walking'
): Promise<DirectionsResult> {
	if (!config.ors.apiKey) {
		throw new Error('OpenRouteService API key not configured');
	}

	// ORS expects coordinates as [lng, lat]
	const coordinates = [
		[origin.lng, origin.lat],
		[destination.lng, destination.lat]
	];

	const response = await fetch(`${ORS_BASE_URL}/directions/${profile}/geojson`, {
		method: 'POST',
		headers: {
			'Authorization': config.ors.apiKey,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			coordinates,
			instructions: true,
			geometry_simplify: true
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`OpenRouteService error: ${error}`);
	}

	const data = await response.json();
	const feature = data.features[0];
	const properties = feature.properties;
	const summary = properties.summary;

	// Extract the route geometry (GeoJSON LineString coordinates)
	const geometry: [number, number][] = feature.geometry.coordinates;

	// Extract turn-by-turn steps if available
	const steps: DirectionStep[] = properties.segments?.[0]?.steps?.map((step: any) => ({
		instruction: step.instruction,
		distance: step.distance,
		duration: step.duration
	})) || [];

	return {
		geometry,
		distance: summary.distance,
		duration: summary.duration,
		steps
	};
}

export async function getMultiStopRoute(
	waypoints: RouteCoordinate[],
	profile: TravelProfile = 'foot-walking'
): Promise<DirectionsResult> {
	if (!config.ors.apiKey) {
		throw new Error('OpenRouteService API key not configured');
	}

	if (waypoints.length < 2) {
		throw new Error('At least 2 waypoints required');
	}

	// ORS expects coordinates as [lng, lat]
	const coordinates = waypoints.map(wp => [wp.lng, wp.lat]);

	const response = await fetch(`${ORS_BASE_URL}/directions/${profile}/geojson`, {
		method: 'POST',
		headers: {
			'Authorization': config.ors.apiKey,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			coordinates,
			instructions: true,
			geometry_simplify: true
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`OpenRouteService error: ${error}`);
	}

	const data = await response.json();
	const feature = data.features[0];
	const properties = feature.properties;
	const summary = properties.summary;

	const geometry: [number, number][] = feature.geometry.coordinates;

	// Combine steps from all segments
	const steps: DirectionStep[] = properties.segments?.flatMap((segment: any) =>
		segment.steps?.map((step: any) => ({
			instruction: step.instruction,
			distance: step.distance,
			duration: step.duration
		})) || []
	) || [];

	return {
		geometry,
		distance: summary.distance,
		duration: summary.duration,
		steps
	};
}
