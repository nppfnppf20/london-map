<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { mapStore } from '$stores/map';
	import { layerStore } from '$stores/layers';
	import { placesStore } from '$stores/places';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';
	import { getRouteColor } from '$utils/map-helpers';
	import type L from 'leaflet';
	import type { Place } from '$types';

	let mapContainer: HTMLDivElement;
	let map: L.Map | null = null;
	let leaflet: typeof L;
	let markers: Map<string, L.Marker> = new Map();

	function createIcon(place: Place) {
		const color = getRouteColor(place.route);
		const isSite = place.priority === 'site';

		// Build optional stop number badge
		let badge = '';
		if (place.tour_stop != null) {
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
			">${place.tour_stop}</div>`;
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

	function handleMarkerClick(place: Place) {
		if ($routeBuilder.active) {
			routeBuilder.addStop(place.id);
		} else {
			selectedPlace.select(place);
		}
	}

	function addMarker(place: Place) {
		if (!map) return;

		// If marker exists, update its icon (place data may have changed)
		if (markers.has(place.id)) {
			const existing = markers.get(place.id)!;
			existing.setIcon(createIcon(place));
			return;
		}

		const marker = leaflet.marker([place.latitude, place.longitude], {
			icon: createIcon(place),
			zIndexOffset: place.priority === 'site' ? 1000 : 0
		});

		marker.on('click', () => handleMarkerClick(place));

		markers.set(place.id, marker);

		// Check if this place's route layer is visible
		const layerState = $layerStore;
		if (place.route && layerState[place.route] !== false) {
			marker.addTo(map);
		} else if (!place.route) {
			marker.addTo(map);
		}
	}

	function updateMarkerVisibility() {
		if (!map) return;

		const layerState = $layerStore;

		markers.forEach((marker, id) => {
			const place = $placesStore.places.find(p => p.id === id);
			if (!place) return;

			const visible = place.route ? layerState[place.route] !== false : true;

			if (visible) {
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

	// React to layer changes
	$: if (map && $layerStore) {
		updateMarkerVisibility();
	}

	// React to place data changes (new places or updated fields)
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
