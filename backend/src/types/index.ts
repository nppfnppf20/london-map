export type Category = 'history' | 'architecture' | 'food' | 'pub';
export type Priority = 'site' | 'route';
export type NearbyMode = 'sites' | 'routes' | 'collections';
export type RouteSearchMode = NearbyMode;

export type Visibility = 'public' | 'private' | 'friends' | 'friends_of_friends';

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
	audio_path: string | null;
	created_by: string | null;
	visibility: Visibility;
	created_at: string;
	updated_at: string;
	collections?: Collection[];
	images?: PlaceImage[];
}

export interface PlaceImage {
	id: string;
	place_id: string;
	image_path: string;
	caption: string | null;
	sort_order: number;
	created_by: string | null;
	created_at: string;
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

export interface NearbyPlacesQuery {
	latitude: number;
	longitude: number;
	radiusMeters: number;
	mode: NearbyMode;
	categories?: Category[];
	routes?: string[];
	collectionIds?: string[];
}

export interface AlongRoutePlacesQuery {
	line: [number, number][];
	widthMeters: number;
	mode: RouteSearchMode;
	categories?: Category[];
	routes?: string[];
	collectionIds?: string[];
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
	created_by: string | null;
	visibility: Visibility;
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

export interface ShareLink {
	id: string;
	token: string;
	name: string;
	place_ids: string[];
	collection_ids: string[];
	route_names: string[];
	created_by: string;
	created_at: string;
}

export interface CreateShareLinkDto {
	name: string;
	place_ids?: string[];
	collection_ids?: string[];
	route_names?: string[];
}

export interface ResolvedShareLink {
	name: string;
	places: Place[];
	collections: Collection[];
	route_names: string[];
}

export interface ApiResponse<T> {
	data: T | null;
	error: string | null;
}

export type Role = 'admin' | 'curator' | 'user';

export interface Profile {
	id: string;
	username: string;
	avatar_url: string | null;
	role: Role;
	created_at: string;
}

export interface AuthUser {
	id: string;
	email: string;
	role: Role;
}

export interface BeaconParticipant {
	name: string;
	lat: number;
	lng: number;
	joined_at: string;
}

export interface Beacon {
	id: string;
	token: string;
	creator_name: string;
	creator_lat: number;
	creator_lng: number;
	categories: Category[];
	image_path: string | null;
	participants: BeaconParticipant[];
	created_by: string | null;
	created_at: string;
}

export interface CreateBeaconDto {
	creator_name: string;
	creator_lat: number;
	creator_lng: number;
	categories: Category[];
	image_path?: string;
}

export interface ParticipantTravelTime {
	name: string;
	durationMinutes: number;
}

export interface MidpointStrategy {
	midpoint: { lat: number; lng: number };
	travelTimes: ParticipantTravelTime[];
	totalMinutes: number;
	fairnessScore: number;
}

export interface MidpointResult {
	strategies: {
		lowestTotal: MidpointStrategy;
		fairest: MidpointStrategy;
	};
}

declare global {
	namespace Express {
		interface Request {
			user?: AuthUser;
		}
	}
}
