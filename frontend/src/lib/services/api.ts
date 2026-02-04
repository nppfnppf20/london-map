import type {
	Place,
	Route,
	Collection,
	PlaceCreateInput,
	PlaceUpdateInput,
	NearbySearchParams,
	RouteSearchParams,
	DirectionsParams,
	MultiStopParams,
	DirectionsResult
} from '$types';

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

	nearby: (params: NearbySearchParams): Promise<Place[]> => {
		const search = new URLSearchParams();
		search.set('lat', String(params.center[0]));
		search.set('lng', String(params.center[1]));
		search.set('radius_meters', String(params.radiusMeters));
		search.set('mode', params.mode);

		if (params.categories?.length) {
			search.set('categories', params.categories.join(','));
		}
		if (params.routes?.length) {
			search.set('routes', params.routes.join(','));
		}
		if (params.collectionIds?.length) {
			search.set('collection_ids', params.collectionIds.join(','));
		}

		return request<Place[]>(`/places/nearby?${search.toString()}`);
	},

	alongRoute: (params: RouteSearchParams): Promise<Place[]> => {
		return request<Place[]>('/places/along-route', {
			method: 'POST',
			body: JSON.stringify({
				line: params.line,
				width_meters: params.widthMeters,
				mode: params.mode,
				categories: params.categories,
				routes: params.routes,
				collection_ids: params.collectionIds
			})
		});
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

	autocomplete: (query: string): Promise<GeocodedPlace[]> => {
		return request<GeocodedPlace[]>(`/geocode/autocomplete?q=${encodeURIComponent(query)}`);
	},

	batch: (places: string[]): Promise<Record<string, GeocodedPlace | null>> => {
		return request<Record<string, GeocodedPlace | null>>('/geocode/batch', {
			method: 'POST',
			body: JSON.stringify({ places })
		});
	}
};

export const routingApi = {
	getDirections: (params: DirectionsParams): Promise<DirectionsResult> => {
		return request<DirectionsResult>('/routing/directions', {
			method: 'POST',
			body: JSON.stringify(params)
		});
	},

	getMultiStopRoute: (params: MultiStopParams): Promise<DirectionsResult> => {
		return request<DirectionsResult>('/routing/multi-stop', {
			method: 'POST',
			body: JSON.stringify(params)
		});
	}
};
