export type Category = 'history' | 'architecture' | 'food' | 'pub';
export type Priority = 'site' | 'route';
export type Visibility = 'public' | 'private' | 'friends' | 'friends_of_friends';
export type Role = 'admin' | 'curator' | 'user';
export type ViewMode = 'collections' | 'sites' | 'routes';
export type NearbyMode = 'sites' | 'routes' | 'collections';
export type RouteSearchMode = NearbyMode;

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

export interface Route {
	id: string;
	name: string;
	description: string | null;
	duration_minutes: number | null;
	stops?: RouteStop[];
	created_at: string;
}

export interface RouteStop {
	id: string;
	route_id: string;
	place_id: string;
	stop_order: number;
	notes: string | null;
	place?: Place;
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

export interface PlaceCreateInput extends Omit<Place, 'id' | 'created_at' | 'updated_at'> {
	collection_ids?: string[];
}

export interface PlaceUpdateInput extends Partial<Place> {
	collection_ids?: string[];
}

export interface LayerState {
	viewMode: ViewMode;
	sites: Record<Category, boolean>;
	routes: Record<string, boolean>;
	collections: Record<string, boolean>;
}

export interface MapState {
	center: [number, number];
	zoom: number;
}

export interface NearbySearchParams {
	center: [number, number];
	radiusMeters: number;
	mode: NearbyMode;
	categories?: Category[];
	routes?: string[];
	collectionIds?: string[];
}

export interface RouteSearchParams {
	line: [number, number][];
	widthMeters: number;
	mode: RouteSearchMode;
	categories?: Category[];
	routes?: string[];
	collectionIds?: string[];
}

export type TravelProfile = 'foot-walking' | 'cycling-regular' | 'driving-car';

export interface DirectionsParams {
	origin: { lat: number; lng: number };
	destination: { lat: number; lng: number };
	profile?: TravelProfile;
}

export interface MultiStopParams {
	waypoints: { lat: number; lng: number }[];
	profile?: TravelProfile;
}

export interface DirectionStep {
	instruction: string;
	distance: number;
	duration: number;
}

export interface DirectionsResult {
	geometry: [number, number][]; // [lng, lat] pairs
	distance: number; // meters
	duration: number; // seconds
	steps?: DirectionStep[];
}

export interface Profile {
	id: string;
	username: string;
	avatar_url: string | null;
	role: Role;
	created_at: string;
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

export interface ResolvedShareLink {
	name: string;
	places: Place[];
	collections: Collection[];
	route_names: string[];
}

export interface BeaconParticipant {
	name: string;
	lat: number;
	lng: number;
	image_path: string | null;
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

export interface CreateBeaconInput {
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

export interface AuthState {
	user: { id: string; email: string; role?: Role } | null;
	session: { access_token: string } | null;
	loading: boolean;
}

export interface LikeStatus {
	liked: boolean;
	count: number;
}

export interface Comment {
	id: string;
	place_id: string;
	user_id: string;
	body: string;
	created_at: string;
	author?: {
		username: string | null;
		avatar_url: string | null;
	};
}
