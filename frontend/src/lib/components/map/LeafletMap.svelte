<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { mapStore } from '$stores/map';
	import { layerStore } from '$stores/layers';
	import { placesStore } from '$stores/places';
	import { nearbyStore } from '$stores/nearby';
	import { routeSearchStore } from '$stores/routeSearch';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';
	import { directionsStore } from '$stores/directions';
	import { getCategoryColor, getRouteColor } from '$utils/map-helpers';
	import type L from 'leaflet';
	import type { Place, LayerState } from '$types';

	let mapContainer: HTMLDivElement;
	let map: L.Map | null = null;
	let leaflet: typeof L;
	let markers: Map<string, L.Marker> = new Map();
	let nearbyCircle: L.Circle | null = null;
	let routeLine: L.Polyline | null = null;
	let directionsLine: L.Polyline | null = null;
	let nearbyIdSet = new Set<string>();
	let routeIdSet = new Set<string>();
	let pinClickHandler: ((e: L.LeafletMouseEvent) => void) | null = null;
	let drawLine: L.Polyline | null = null;
	let isDrawingStroke = false;
	let drawPoints: L.LatLng[] = [];
	let wasDrawing = false;
	let lastFlyToTrigger = 0;
	let locationMarker: L.Marker | null = null;
	let locationAccuracyCircle: L.Circle | null = null;
	let watchId: number | null = null;

	export let pinMode = false;

	// Determine how a place should render given current layer state
	function getDisplayMode(place: Place, layers: LayerState): 'route' | 'site' | 'hidden' {
		if ($routeBuilder.active && place.route === $routeBuilder.routeName && place.route_stop != null) {
			return 'route';
		}

		if ($routeSearchStore.active) {
			if (!routeIdSet.has(place.id)) {
				return 'hidden';
			}
			return $routeSearchStore.mode === 'routes' ? 'route' : 'site';
		}

		if ($nearbyStore.active) {
			if (!nearbyIdSet.has(place.id)) {
				return 'hidden';
			}
			return $nearbyStore.mode === 'routes' ? 'route' : 'site';
		}

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

	function updateDrawingLine(): void {
		if (!map || !leaflet) return;
		if (!drawLine) {
			drawLine = leaflet.polyline(drawPoints, {
				color: '#e94560',
				weight: 4,
				opacity: 0.9,
				lineCap: 'round'
			}).addTo(map);
		} else {
			drawLine.setLatLngs(drawPoints);
		}
	}

	function handleDrawStart(e: L.LeafletMouseEvent) {
		if (!map || !$routeSearchStore.drawing) return;
		isDrawingStroke = true;
		if (drawPoints.length === 0) {
			drawPoints = [e.latlng];
		} else {
			drawPoints.push(e.latlng);
		}
		routeSearchStore.setLine(drawPoints.map(point => [point.lat, point.lng]));
		updateDrawingLine();
	}

	function handleDrawMove(e: L.LeafletMouseEvent) {
		if (!map || !$routeSearchStore.drawing) return;
		if (!$routeSearchStore.painting && !isDrawingStroke) return;
		const last = drawPoints[drawPoints.length - 1];
		if (!last) {
			drawPoints = [e.latlng];
			routeSearchStore.setLine(drawPoints.map(point => [point.lat, point.lng]));
			updateDrawingLine();
			return;
		}
		const distance = last.distanceTo(e.latlng);
		if (distance < 20) return;
		drawPoints.push(e.latlng);
		routeSearchStore.setLine(drawPoints.map(point => [point.lat, point.lng]));
		updateDrawingLine();
	}

	function handleDrawEnd() {
		if (!isDrawingStroke) return;
		isDrawingStroke = false;
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
		selectedPlace.select(place);
	}

	function updateLocationMarker(lat: number, lng: number, accuracy: number) {
		if (!map || !leaflet) return;

		const latlng = leaflet.latLng(lat, lng);

		// Create or update the accuracy circle
		if (!locationAccuracyCircle) {
			locationAccuracyCircle = leaflet.circle(latlng, {
				radius: accuracy,
				color: '#3b82f6',
				fillColor: '#3b82f6',
				fillOpacity: 0.1,
				weight: 1,
				opacity: 0.3
			}).addTo(map);
		} else {
			locationAccuracyCircle.setLatLng(latlng);
			locationAccuracyCircle.setRadius(accuracy);
		}

		// Create or update the location dot
		if (!locationMarker) {
			const locationIcon = leaflet.divIcon({
				className: 'current-location-marker',
				html: `<div class="location-dot">
					<div class="location-dot-inner"></div>
					<div class="location-dot-pulse"></div>
				</div>`,
				iconSize: [20, 20],
				iconAnchor: [10, 10]
			});
			locationMarker = leaflet.marker(latlng, {
				icon: locationIcon,
				zIndexOffset: 2000
			}).addTo(map);
		} else {
			locationMarker.setLatLng(latlng);
		}
	}

	function startLocationWatch() {
		if (!navigator.geolocation) return;

		watchId = navigator.geolocation.watchPosition(
			(position) => {
				updateLocationMarker(
					position.coords.latitude,
					position.coords.longitude,
					position.coords.accuracy
				);
			},
			(error) => {
				console.warn('Geolocation error:', error.message);
			},
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 5000
			}
		);
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

		map.on('mousedown', handleDrawStart);
		map.on('mousemove', handleDrawMove);
		map.on('mouseup', handleDrawEnd);
		map.on('mouseout', handleDrawEnd);
		map.on('touchstart', (e: L.LeafletMouseEvent) => handleDrawStart(e));
		map.on('touchmove', (e: L.LeafletMouseEvent) => handleDrawMove(e));
		map.on('touchend', () => handleDrawEnd());

		await placesStore.fetchAll();
		$placesStore.places.forEach(addMarker);

		// Start watching user location
		startLocationWatch();
	});

	onDestroy(() => {
		if (watchId !== null) {
			navigator.geolocation.clearWatch(watchId);
			watchId = null;
		}
		if (map) {
			map.remove();
			map = null;
		}
		if (routeLine) {
			routeLine.remove();
			routeLine = null;
		}
		if (directionsLine) {
			directionsLine.remove();
			directionsLine = null;
		}
		if (drawLine) {
			drawLine.remove();
			drawLine = null;
		}
		markers.clear();
	});

	// React to layer changes — update visibility AND icons
	$: if (map && $layerStore && $nearbyStore && $routeSearchStore) {
		updateMarkers();
	}

	// React to place data changes
	$: if (map && leaflet && $placesStore.places) {
		$placesStore.places.forEach(addMarker);
	}

	$: if ($nearbyStore.active) {
		nearbyIdSet = new Set($nearbyStore.placeIds);
	} else {
		nearbyIdSet = new Set();
	}

	$: if ($routeSearchStore.active) {
		routeIdSet = new Set($routeSearchStore.placeIds);
	} else {
		routeIdSet = new Set();
	}

	// Enable/disable pin click behavior for placement mode
	$: if (map) {
		setPinClickHandling();
	}

	// React to flyTo requests from the store
	$: if (map && $mapStore.flyToTrigger > lastFlyToTrigger) {
		lastFlyToTrigger = $mapStore.flyToTrigger;
		map.flyTo($mapStore.center, $mapStore.zoom, { duration: 0.8 });
	}

	// Toggle drawing mode
	$: if (map) {
		if ($routeSearchStore.drawing) {
			if (!wasDrawing) {
				drawPoints = [];
			}
			map.dragging.disable();
			if ($routeSearchStore.painting) {
				map.getContainer().style.cursor = 'crosshair';
			} else {
				map.getContainer().style.cursor = '';
			}
			wasDrawing = true;
		} else {
			map.dragging.enable();
			map.getContainer().style.cursor = '';
			if (drawLine) {
				drawLine.remove();
				drawLine = null;
			}
			wasDrawing = false;
		}
	}

	// Render nearby radius overlay
	$: if (map && leaflet) {
		if ($nearbyStore.active && $nearbyStore.center) {
			if (!nearbyCircle) {
				nearbyCircle = leaflet.circle($nearbyStore.center, {
					radius: $nearbyStore.radiusMeters,
					color: '#e94560',
					weight: 2,
					fillColor: '#e94560',
					fillOpacity: 0.1
				});
				nearbyCircle.addTo(map);
			} else {
				nearbyCircle.setLatLng($nearbyStore.center);
				nearbyCircle.setRadius($nearbyStore.radiusMeters);
				if (!map.hasLayer(nearbyCircle)) {
					nearbyCircle.addTo(map);
				}
			}
		} else if (nearbyCircle) {
			nearbyCircle.remove();
			nearbyCircle = null;
		}
	}

	// Render route line overlay
	$: if (map && leaflet) {
		if ($routeSearchStore.drawing) {
			if (routeLine) {
				routeLine.remove();
				routeLine = null;
			}
		} else if ($routeSearchStore.line.length > 0) {
			const latlngs = $routeSearchStore.line.map(point => leaflet.latLng(point[0], point[1]));
			if (!routeLine) {
				routeLine = leaflet.polyline(latlngs, {
					color: '#111827',
					weight: 4,
					opacity: 0.85,
					lineCap: 'round'
				}).addTo(map);
			} else {
				routeLine.setLatLngs(latlngs);
				if (!map.hasLayer(routeLine)) {
					routeLine.addTo(map);
				}
			}
		} else if (routeLine) {
			routeLine.remove();
			routeLine = null;
		}
	}

	// Render directions polyline (from OpenRouteService)
	$: if (map && leaflet) {
		if ($directionsStore.active && $directionsStore.result?.geometry) {
			// ORS returns [lng, lat] pairs, Leaflet needs [lat, lng]
			const latlngs = $directionsStore.result.geometry.map(
				coord => leaflet.latLng(coord[1], coord[0])
			);
			if (!directionsLine) {
				directionsLine = leaflet.polyline(latlngs, {
					color: '#3b82f6',
					weight: 5,
					opacity: 0.8,
					lineCap: 'round',
					lineJoin: 'round'
				}).addTo(map);
				// Fit map to show the entire route
				map.fitBounds(directionsLine.getBounds(), { padding: [50, 50] });
			} else {
				directionsLine.setLatLngs(latlngs);
				if (!map.hasLayer(directionsLine)) {
					directionsLine.addTo(map);
				}
			}
		} else if (directionsLine) {
			directionsLine.remove();
			directionsLine = null;
		}
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
		margin-bottom: calc(var(--bottom-bar-height, 0px) + env(safe-area-inset-bottom, 0px) + var(--spacing-md)) !important;
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

	:global(.current-location-marker) {
		background: transparent !important;
		border: none !important;
	}

	:global(.location-dot) {
		position: relative;
		width: 20px;
		height: 20px;
	}

	:global(.location-dot-inner) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 14px;
		height: 14px;
		background: #3b82f6;
		border: 3px solid white;
		border-radius: 50%;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
	}

	:global(.location-dot-pulse) {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 20px;
		height: 20px;
		background: #3b82f6;
		border-radius: 50%;
		opacity: 0.4;
		animation: location-pulse 2s ease-out infinite;
	}

	@keyframes location-pulse {
		0% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 0.4;
		}
		100% {
			transform: translate(-50%, -50%) scale(2.5);
			opacity: 0;
		}
	}
</style>
