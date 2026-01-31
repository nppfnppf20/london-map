export type Category = 'history' | 'architecture' | 'food' | 'pub';
export type Priority = 'site' | 'route';

export interface Place {
	id: string;
	name: string;
	description: string | null;
	latitude: number;
	longitude: number;
	category: Category;
	priority: Priority | null;
	route: string | null;
	route_stop: number | null;
	tags: string[];
	created_at: string;
	updated_at: string;
}

export interface CreatePlaceDto {
	name: string;
	description?: string;
	latitude: number;
	longitude: number;
	category: Category;
	priority?: Priority;
	route?: string;
	route_stop?: number;
	tags?: string[];
	collection_ids?: string[];
}

export interface UpdatePlaceDto {
	name?: string;
	description?: string;
	latitude?: number;
	longitude?: number;
	category?: Category;
	priority?: Priority;
	route?: string | null;
	route_stop?: number | null;
	tags?: string[];
	collection_ids?: string[];
}

export interface Route {
	id: string;
	name: string;
	description: string | null;
	duration_minutes: number | null;
	created_at: string;
}

export interface RouteStop {
	id: string;
	route_id: string;
	place_id: string;
	stop_order: number;
	notes: string | null;
}

export interface Collection {
	id: string;
	name: string;
	description: string | null;
	color: string | null;
	created_at: string;
	updated_at: string;
}

export interface CreateCollectionDto {
	name: string;
	description?: string;
	color?: string;
}

export interface UpdateCollectionDto {
	name?: string;
	description?: string | null;
	color?: string | null;
}

export interface ApiResponse<T> {
	data: T | null;
	error: string | null;
}
