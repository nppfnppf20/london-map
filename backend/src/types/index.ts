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
	tour_stop: number | null;
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
	tour_stop?: number;
	tags?: string[];
}

export interface UpdatePlaceDto {
	name?: string;
	description?: string;
	latitude?: number;
	longitude?: number;
	category?: Category;
	priority?: Priority;
	route?: string;
	tags?: string[];
}

export interface Tour {
	id: string;
	name: string;
	description: string | null;
	duration_minutes: number | null;
	created_at: string;
}

export interface TourStop {
	id: string;
	tour_id: string;
	place_id: string;
	stop_order: number;
	notes: string | null;
}

export interface ApiResponse<T> {
	data: T | null;
	error: string | null;
}
