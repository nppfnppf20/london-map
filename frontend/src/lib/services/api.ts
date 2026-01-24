import type { Place, Tour } from '$types';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
	data: T | null;
	error: string | null;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
	const response = await fetch(`${API_URL}${endpoint}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options?.headers
		}
	});

	const result: ApiResponse<T> = await response.json();

	if (result.error) {
		throw new Error(result.error);
	}

	return result.data as T;
}

export const placesApi = {
	getAll: (category?: string): Promise<Place[]> => {
		const params = category ? `?category=${category}` : '';
		return request<Place[]>(`/places${params}`);
	},

	getById: (id: string): Promise<Place> => {
		return request<Place>(`/places/${id}`);
	},

	create: (place: Omit<Place, 'id' | 'created_at' | 'updated_at'>): Promise<Place> => {
		return request<Place>('/places', {
			method: 'POST',
			body: JSON.stringify(place)
		});
	},

	update: (id: string, place: Partial<Place>): Promise<Place> => {
		return request<Place>(`/places/${id}`, {
			method: 'PUT',
			body: JSON.stringify(place)
		});
	},

	delete: (id: string): Promise<void> => {
		return request<void>(`/places/${id}`, {
			method: 'DELETE'
		});
	}
};

export const toursApi = {
	getAll: (): Promise<Tour[]> => {
		return request<Tour[]>('/tours');
	},

	getById: (id: string): Promise<Tour> => {
		return request<Tour>(`/tours/${id}`);
	}
};

export interface GeocodedPlace {
	name: string;
	latitude: number;
	longitude: number;
	displayName: string;
	type: string;
}

export const geocodeApi = {
	search: (query: string): Promise<GeocodedPlace[]> => {
		return request<GeocodedPlace[]>(`/geocode/search?q=${encodeURIComponent(query)}`);
	},

	batch: (places: string[]): Promise<Record<string, GeocodedPlace | null>> => {
		return request<Record<string, GeocodedPlace | null>>('/geocode/batch', {
			method: 'POST',
			body: JSON.stringify({ places })
		});
	}
};
