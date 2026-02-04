import { config } from '../config/index.js';

interface NominatimResult {
	place_id: number;
	lat: string;
	lon: string;
	display_name: string;
	type: string;
	importance: number;
}

interface ORSFeature {
	type: 'Feature';
	geometry: {
		type: 'Point';
		coordinates: [number, number]; // [lng, lat]
	};
	properties: {
		id: string;
		name: string;
		label: string;
		layer: string;
		locality?: string;
		region?: string;
		country?: string;
	};
}

interface ORSGeocodeResponse {
	type: 'FeatureCollection';
	features: ORSFeature[];
}

export interface GeocodedPlace {
	name: string;
	latitude: number;
	longitude: number;
	displayName: string;
	type: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const ORS_GEOCODE_BASE = 'https://api.openrouteservice.org/geocode';

// Rate limiting: 1 request per second
let lastRequestTime = 0;

async function rateLimitedFetch(url: string): Promise<Response> {
	const now = Date.now();
	const timeSinceLastRequest = now - lastRequestTime;

	if (timeSinceLastRequest < 1000) {
		await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
	}

	lastRequestTime = Date.now();

	return fetch(url, {
		headers: {
			'User-Agent': 'LondonApp/1.0'
		}
	});
}

export async function geocode(query: string): Promise<GeocodedPlace[]> {
	// Bias search towards London
	const params = new URLSearchParams({
		q: query,
		format: 'json',
		limit: '5',
		viewbox: '-0.5103,51.2868,0.3340,51.6919', // London bounding box
		bounded: '1'
	});

	const response = await rateLimitedFetch(`${NOMINATIM_BASE}/search?${params}`);

	if (!response.ok) {
		throw new Error(`Geocoding failed: ${response.statusText}`);
	}

	const results: NominatimResult[] = await response.json();

	return results.map(r => ({
		name: r.display_name.split(',')[0],
		latitude: parseFloat(r.lat),
		longitude: parseFloat(r.lon),
		displayName: r.display_name,
		type: r.type
	}));
}

export async function geocodeOne(query: string): Promise<GeocodedPlace | null> {
	const results = await geocode(query);
	return results[0] || null;
}

export async function batchGeocode(queries: string[]): Promise<Map<string, GeocodedPlace | null>> {
	const results = new Map<string, GeocodedPlace | null>();

	for (const query of queries) {
		const result = await geocodeOne(query);
		results.set(query, result);
	}

	return results;
}

// ORS Geocoding - faster, better for autocomplete
export async function autocomplete(query: string): Promise<GeocodedPlace[]> {
	if (!config.ors.apiKey) {
		throw new Error('OpenRouteService API key not configured');
	}

	const params = new URLSearchParams({
		api_key: config.ors.apiKey,
		text: query,
		size: '5',
		'boundary.rect.min_lon': '-0.5103',
		'boundary.rect.min_lat': '51.2868',
		'boundary.rect.max_lon': '0.3340',
		'boundary.rect.max_lat': '51.6919',
		layers: 'venue,street,address,neighbourhood,locality'
	});

	const response = await fetch(`${ORS_GEOCODE_BASE}/autocomplete?${params}`);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`ORS Geocoding failed: ${error}`);
	}

	const data: ORSGeocodeResponse = await response.json();

	return data.features.map(f => ({
		name: f.properties.name,
		latitude: f.geometry.coordinates[1],
		longitude: f.geometry.coordinates[0],
		displayName: f.properties.label,
		type: f.properties.layer
	}));
}

export async function searchPlace(query: string): Promise<GeocodedPlace[]> {
	if (!config.ors.apiKey) {
		throw new Error('OpenRouteService API key not configured');
	}

	const params = new URLSearchParams({
		api_key: config.ors.apiKey,
		text: query,
		size: '5',
		'boundary.rect.min_lon': '-0.5103',
		'boundary.rect.min_lat': '51.2868',
		'boundary.rect.max_lon': '0.3340',
		'boundary.rect.max_lat': '51.6919'
	});

	const response = await fetch(`${ORS_GEOCODE_BASE}/search?${params}`);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`ORS Geocoding failed: ${error}`);
	}

	const data: ORSGeocodeResponse = await response.json();

	return data.features.map(f => ({
		name: f.properties.name,
		latitude: f.geometry.coordinates[1],
		longitude: f.geometry.coordinates[0],
		displayName: f.properties.label,
		type: f.properties.layer
	}));
}
