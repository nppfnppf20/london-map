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

export interface Tour {
	id: string;
	name: string;
	description: string | null;
	duration_minutes: number | null;
	stops?: TourStop[];
	created_at: string;
}

export interface TourStop {
	id: string;
	tour_id: string;
	place_id: string;
	stop_order: number;
	notes: string | null;
	place?: Place;
}

export interface LayerState {
	history: boolean;
	architecture: boolean;
	food: boolean;
	pub: boolean;
	tours: boolean;
}

export interface MapState {
	center: [number, number];
	zoom: number;
}
