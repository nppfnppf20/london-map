import type { Place, Route, Collection, PlaceCreateInput, PlaceUpdateInput } from '$types';

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

	if (response.status === 204) {
		return null as T;
	}

	const raw = await response.text();
	if (!raw) {
		return null as T;
	}

	const result: ApiResponse<T> = JSON.parse(raw);

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

	create: (place: PlaceCreateInput): Promise<Place> => {
		return request<Place>('/places', {
			method: 'POST',
			body: JSON.stringify(place)
		});
	},

	update: (id: string, place: PlaceUpdateInput): Promise<Place> => {
		return request<Place>(`/places/${id}`, {
			method: 'PUT',
			body: JSON.stringify(place)
		});
	},

	delete: (id: string): Promise<void> => {
		return request<void>(`/places/${id}`, {
			method: 'DELETE'
		});
	},

	addCollections: (id: string, collection_ids: string[]): Promise<void> => {
		return request<void>(`/places/${id}/collections`, {
			method: 'POST',
			body: JSON.stringify({ collection_ids })
		});
	},

	uploadAudio: async (id: string, audio: Blob, durationSeconds?: number): Promise<Place> => {
		const form = new FormData();
		form.append('audio', audio);
		if (durationSeconds !== undefined) {
			form.append('duration_seconds', String(durationSeconds));
		}

		const response = await fetch(`${API_URL}/places/${id}/audio`, {
			method: 'POST',
			body: form
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(text || 'Failed to upload audio');
		}

		const result: ApiResponse<Place> = await response.json();
		if (result.error) {
			throw new Error(result.error);
		}

		return result.data as Place;
	}
};

export const routesApi = {
	getAll: (): Promise<Route[]> => {
		return request<Route[]>('/routes');
	},

	getById: (id: string): Promise<Route> => {
		return request<Route>(`/routes/${id}`);
	}
};

export const collectionsApi = {
	getAll: (): Promise<Collection[]> => {
		return request<Collection[]>('/collections');
	},

	getById: (id: string): Promise<Collection> => {
		return request<Collection>(`/collections/${id}`);
	},

	create: (collection: Partial<Collection> & { name: string }): Promise<Collection> => {
		return request<Collection>('/collections', {
			method: 'POST',
			body: JSON.stringify(collection)
		});
	},

	update: (id: string, collection: Partial<Collection>): Promise<Collection> => {
		return request<Collection>(`/collections/${id}`, {
			method: 'PUT',
			body: JSON.stringify(collection)
		});
	},

	delete: (id: string): Promise<void> => {
		return request<void>(`/collections/${id}`, {
			method: 'DELETE'
		});
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
