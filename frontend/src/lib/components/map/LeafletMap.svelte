<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { mapStore } from '$stores/map';
	import { layerStore } from '$stores/layers';
	import { placesStore } from '$stores/places';
	import { selectedPlace } from '$stores/selected';
	import { getRouteColor } from '$utils/map-helpers';
	import type L from 'leaflet';
	import type { Place, Category, Priority } from '$types';

	let mapContainer: HTMLDivElement;
	let map: L.Map | null = null;
	let leaflet: typeof L;
	let markers: Map<string, L.Marker> = new Map();

	function createIcon(route: string | null, priority: Priority | null) {
		const color = getRouteColor(route);
		const isSite = priority === 'site';

		// Site markers are bigger and have a pin shape
		if (isSite) {
			return leaflet.divIcon({
				className: 'custom-marker site-marker',
				html: `<div style="
					width: 32px;
					height: 32px;
					background: ${color};
					border: 4px solid white;
					border-radius: 50% 50% 50% 0;
					transform: rotate(-45deg);
					box-shadow: 0 3px 8px rgba(0,0,0,0.4);
				"></div>`,
				iconSize: [32, 32],
				iconAnchor: [16, 32],
				popupAnchor: [0, -32]
			});
		}

		// Route markers are smaller dots
		return leaflet.divIcon({
			className: 'custom-marker route-marker',
			html: `<div style="
				width: 16px;
				height: 16px;
				background: ${color};
				border: 2px solid white;
				border-radius: 50%;
				box-shadow: 0 2px 4px rgba(0,0,0,0.3);
				opacity: 0.85;
			"></div>`,
			iconSize: [16, 16],
			iconAnchor: [8, 8],
			popupAnchor: [0, -8]
		});
	}

	function addMarker(place: Place) {
		if (!map || markers.has(place.id)) return;

		const marker = leaflet.marker([place.latitude, place.longitude], {
			icon: createIcon(place.route, place.priority),
			zIndexOffset: place.priority === 'site' ? 1000 : 0
		});

		// Click to open detail panel instead of popup
		marker.on('click', () => {
			selectedPlace.select(place);
		});

		markers.set(place.id, marker);

		// Check if layer is visible
		const layerState = $layerStore;
		if (layerState[place.category]) {
			marker.addTo(map);
		}
	}

	function updateMarkerVisibility() {
		if (!map) return;

		const layerState = $layerStore;

		markers.forEach((marker, id) => {
			const place = $placesStore.places.find(p => p.id === id);
			if (!place) return;

			if (layerState[place.category]) {
				if (!map!.hasLayer(marker)) {
					marker.addTo(map!);
				}
			} else {
				if (map!.hasLayer(marker)) {
					marker.remove();
				}
			}
		});
	}

	onMount(async () => {
		leaflet = await import('leaflet');

		map = leaflet.map(mapContainer, {
			zoomControl: false,
			tap: true,
			tapTolerance: 15,
			touchZoom: 'center',
			bounceAtZoomLimits: false
		}).setView($mapStore.center, $mapStore.zoom);

		// Add tile layer (OpenStreetMap)
		leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19
		}).addTo(map);

		// Add zoom control to bottom right (better for mobile)
		leaflet.control.zoom({
			position: 'bottomright'
		}).addTo(map);

		// Update store on map move
		map.on('moveend', () => {
			if (map) {
				const center = map.getCenter();
				mapStore.setCenter([center.lat, center.lng]);
			}
		});

		map.on('zoomend', () => {
			if (map) {
				mapStore.setZoom(map.getZoom());
			}
		});

		// Fetch and display places
		await placesStore.fetchAll();
		$placesStore.places.forEach(addMarker);
	});

	onDestroy(() => {
		if (map) {
			map.remove();
			map = null;
		}
		markers.clear();
	});

	// React to layer changes
	$: if (map && $layerStore) {
		updateMarkerVisibility();
	}

	// React to new places
	$: if (map && leaflet && $placesStore.places) {
		$placesStore.places.forEach(addMarker);
	}

	export function getMap(): L.Map | null {
		return map;
	}
</script>

<div class="map-container" bind:this={mapContainer}></div>

<style>
	.map-container {
		width: 100%;
		height: 100%;
		touch-action: none;
	}

	:global(.leaflet-control-zoom) {
		border: none !important;
		box-shadow: var(--shadow-md) !important;
		margin-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px)) !important;
		margin-right: var(--spacing-md) !important;
	}

	:global(.leaflet-control-zoom a) {
		width: 44px !important;
		height: 44px !important;
		line-height: 44px !important;
		font-size: 20px !important;
	}

	:global(.leaflet-control-attribution) {
		font-size: 10px;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}
</style>
