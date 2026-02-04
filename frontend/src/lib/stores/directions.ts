import { writable } from 'svelte/store';
import type { TravelProfile, DirectionsResult, DirectionStep } from '$types';
import { routingApi } from '$services/api';

interface DirectionsState {
	active: boolean;
	origin: { lat: number; lng: number; name?: string } | null;
	destination: { lat: number; lng: number; name?: string } | null;
	profile: TravelProfile;
	result: DirectionsResult | null;
	loading: boolean;
	error: string | null;
}

const initialState: DirectionsState = {
	active: false,
	origin: null,
	destination: null,
	profile: 'foot-walking',
	result: null,
	loading: false,
	error: null
};

function createDirectionsStore() {
	const { subscribe, update, set } = writable<DirectionsState>(initialState);

	return {
		subscribe,

		setProfile(profile: TravelProfile): void {
			update(state => ({ ...state, profile }));
		},

		async getDirections(
			origin: { lat: number; lng: number; name?: string },
			destination: { lat: number; lng: number; name?: string },
			profile?: TravelProfile
		): Promise<boolean> {
			update(state => ({
				...state,
				active: true,
				origin,
				destination,
				profile: profile ?? state.profile,
				loading: true,
				error: null,
				result: null
			}));

			try {
				const result = await routingApi.getDirections({
					origin: { lat: origin.lat, lng: origin.lng },
					destination: { lat: destination.lat, lng: destination.lng },
					profile: profile
				});

				update(state => ({
					...state,
					result,
					loading: false
				}));
				return true;
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to get directions';
				update(state => ({ ...state, loading: false, error: message }));
				return false;
			}
		},

		async getMultiStopRoute(
			waypoints: { lat: number; lng: number; name?: string }[],
			profile?: TravelProfile
		): Promise<boolean> {
			if (waypoints.length < 2) {
				update(state => ({ ...state, error: 'At least 2 waypoints required' }));
				return false;
			}

			update(state => ({
				...state,
				active: true,
				origin: waypoints[0],
				destination: waypoints[waypoints.length - 1],
				profile: profile ?? state.profile,
				loading: true,
				error: null,
				result: null
			}));

			try {
				const result = await routingApi.getMultiStopRoute({
					waypoints: waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
					profile: profile
				});

				update(state => ({
					...state,
					result,
					loading: false
				}));
				return true;
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Failed to get route';
				update(state => ({ ...state, loading: false, error: message }));
				return false;
			}
		},

		clear(): void {
			set(initialState);
		}
	};
}

export const directionsStore = createDirectionsStore();

// Helper to format duration
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);

	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes} min`;
}

// Helper to format distance
export function formatDistance(meters: number): string {
	if (meters >= 1000) {
		return `${(meters / 1000).toFixed(1)} km`;
	}
	return `${Math.round(meters)} m`;
}

// Helper to generate Google Maps URL
export function getGoogleMapsUrl(
	origin: { lat: number; lng: number },
	destination: { lat: number; lng: number },
	travelMode: 'walking' | 'driving' | 'bicycling' = 'walking'
): string {
	return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=${travelMode}`;
}
