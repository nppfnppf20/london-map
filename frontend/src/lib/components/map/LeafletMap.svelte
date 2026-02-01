<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { mapStore } from '$stores/map';
	import { layerStore } from '$stores/layers';
	import { placesStore } from '$stores/places';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';
	import { getCategoryColor, getRouteColor } from '$utils/map-helpers';
	import type L from 'leaflet';
	import type { Place, LayerState } from '$types';

	let mapContainer: HTMLDivElement;
	let map: L.Map | null = null;
	let leaflet: typeof L;
	let markers: Map<string, L.Marker> = new Map();
	let pinClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;

	export let pinMode = false;

	// Determine how a place should render given current layer state
	function getDisplayMode(place: Place, layers: LayerState): 'route' | 'site' | 'hidden' {
		if (layers.viewMode === 'routes') {
			if (place.route && layers.routes[place.route]) {
				return 'route';
			}
			return 'hidden';
		}

		if (layers.viewMode === 'collections') {
			if (!place.collections || place.collections.length === 0) return 'hidden';
			for (const collection of place.collections) {
				if (layers.collections[collection.id]) {
					return 'site';
				}
			}
			return 'hidden';
		}

		if (layers.viewMode === 'sites') {
			if (layers.sites[place.category]) {
				return 'site';
			}
			return 'hidden';
		}

		return 'hidden';
	}

	function setPinClickHandling() {
		if (!map) return;
		if (pinMode) {
			if (!pinClickHandler) {
				pinClickHandler = (e: L.LeafletMouseEvent) => {
					map!.setView(e.latlng, map!.getZoom(), { animate: true });
				};
			}
			map.on('click', pinClickHandler);
		} else if (pinClickHandler) {
			map.off('click', pinClickHandler);
		}
	}

	function createIcon(place: Place, mode: 'route' | 'site') {
		if (mode === 'route') {
			const color = getRouteColor(place.route);
			const isSite = place.priority === 'site';

			let badge = '';
			if (place.route_stop != null) {
				badge = `<div style="
					position: absolute;
					top: -8px;
					right: -8px;
					width: 20px;
					height: 20px;
					background: white;
					color: ${color};
					border-radius: 50%;
					font-size: 11px;
					font-weight: 700;
					display: flex;
					align-items: center;
					justify-content: center;
					box-shadow: 0 1px 3px rgba(0,0,0,0.3);
					line-height: 1;
				">${place.route_stop}</div>`;
			}

			if (isSite) {
				return leaflet.divIcon({
					className: 'custom-marker site-marker',
					html: `<div style="position:relative;">
						<div style="
							width: 32px;
							height: 32px;
							background: ${color};
							border: 4px solid white;
							border-radius: 50% 50% 50% 0;
							transform: rotate(-45deg);
							box-shadow: 0 3px 8px rgba(0,0,0,0.4);
						"></div>
						${badge}
					</div>`,
					iconSize: [32, 32],
					iconAnchor: [16, 32],
					popupAnchor: [0, -32]
				});
			}

			return leaflet.divIcon({
				className: 'custom-marker route-marker',
				html: `<div style="position:relative;">
					<div style="
						width: 16px;
						height: 16px;
						background: ${color};
						border: 2px solid white;
						border-radius: 50%;
						box-shadow: 0 2px 4px rgba(0,0,0,0.3);
						opacity: 0.85;
					"></div>
					${badge}
				</div>`,
				iconSize: [16, 16],
				iconAnchor: [8, 8],
				popupAnchor: [0, -8]
			});
		}

		// Site mode — category colour, no badge
		const color = getCategoryColor(place.category);
		const isSite = place.priority === 'site';

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

	function handleMarkerClick(place: Place) {
		if (pinMode) return;
		if ($routeBuilder.active) {
			routeBuilder.addStop(place.id);
		} else {
			selectedPlace.select(place);
		}
	}

	function addMarker(place: Place) {
		if (!map) return;

		const layers = $layerStore;
		const mode = getDisplayMode(place, layers);

		if (markers.has(place.id)) {
			const existing = markers.get(place.id)!;
			if (mode === 'hidden') {
				if (map.hasLayer(existing)) existing.remove();
			} else {
				existing.setIcon(createIcon(place, mode));
				if (!map.hasLayer(existing)) existing.addTo(map);
			}
			return;
		}

		// First time — create the marker
		const marker = leaflet.marker([place.latitude, place.longitude], {
			icon: createIcon(place, mode === 'hidden' ? 'site' : mode),
			zIndexOffset: place.priority === 'site' ? 1000 : 0
		});

		marker.on('click', () => handleMarkerClick(place));
		markers.set(place.id, marker);

		if (mode !== 'hidden') {
			marker.addTo(map);
		}
	}

	function updateMarkers() {
		if (!map) return;

		const layers = $layerStore;

		markers.forEach((marker, id) => {
			const place = $placesStore.places.find(p => p.id === id);
			if (!place) return;

			const mode = getDisplayMode(place, layers);

			if (mode === 'hidden') {
				if (map!.hasLayer(marker)) marker.remove();
			} else {
				marker.setIcon(createIcon(place, mode));
				if (!map!.hasLayer(marker)) marker.addTo(map!);
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

		leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
			maxZoom: 19
		}).addTo(map);

		leaflet.control.zoom({
			position: 'bottomright'
		}).addTo(map);

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

	// React to layer changes — update visibility AND icons
	$: if (map && $layerStore) {
		updateMarkers();
	}

	// React to place data changes
	$: if (map && leaflet && $placesStore.places) {
		$placesStore.places.forEach(addMarker);
	}

	// Enable/disable pin click behavior for placement mode
	$: if (map) {
		setPinClickHandling();
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
