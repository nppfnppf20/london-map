import type { Category } from '$types';
import { get } from 'svelte/store';
import { routesStore } from '$stores/routes';

export const CATEGORY_COLORS: Record<Category, string> = {
	history: '#3b82f6',
	architecture: '#8b5cf6',
	food: '#f97316',
	pub: '#f59e0b'
};

export const CATEGORY_LABELS: Record<Category, string> = {
	history: 'History',
	architecture: 'Architecture',
	food: 'Food',
	pub: 'Pubs'
};

export function getCategoryColor(category: Category): string {
	return CATEGORY_COLORS[category] || '#6b7280';
}

export function getRouteColor(route: string | null): string {
	if (!route) return '#6b7280';
	const routes = get(routesStore);
	return routes[route] || '#6b7280';
}

export function createMarkerIcon(category: Category): string {
	const color = getCategoryColor(category);
	return `
		<svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
			<path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 9.4 12.5 28.5 12.5 28.5S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
			<circle cx="12.5" cy="12.5" r="6" fill="white"/>
		</svg>
	`;
}

export const COLOR_SWATCHES = [
	{ name: 'Red', value: '#dc2626' },
	{ name: 'Orange', value: '#f97316' },
	{ name: 'Amber', value: '#f59e0b' },
	{ name: 'Green', value: '#22c55e' },
	{ name: 'Teal', value: '#14b8a6' },
	{ name: 'Blue', value: '#3b82f6' },
	{ name: 'Purple', value: '#8b5cf6' },
	{ name: 'Pink', value: '#ec4899' }
];
