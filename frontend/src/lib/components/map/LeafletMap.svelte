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
	import { beaconStore } from '$stores/beacon';
	import { getCategoryColor, getRouteColor } from '$utils/map-helpers';
	import type { Place, LayerState } from '$types';
	import type mapboxgl from 'mapbox-gl';

	const COLLECTION_FALLBACK_COLOR = '#94a3b8';

	function getCollectionColor(place: Place, layers: LayerState): string {
		if (!place.collections || place.collections.length === 0) return COLLECTION_FALLBACK_COLOR;
		for (const collection of place.collections) {
			if (layers.collections[collection.id]) {
				return collection.color || COLLECTION_FALLBACK_COLOR;
			}
		}
		return COLLECTION_FALLBACK_COLOR;
	}

	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map | null = null;
	let mb: typeof mapboxgl | null = null;

	type MarkerEntry = { marker: mapboxgl.Marker; el: HTMLDivElement; visible: boolean };
	let markers: Map<string, MarkerEntry> = new Map();

	let nearbyIdSet = new Set<string>();
	let routeIdSet = new Set<string>();
	let beaconIdSet = new Set<string>();
	let lastFlyToTrigger = 0;
	let expandedRoute: string | null = null;
	let routePreviewIds = new Set<string>();

	// Drawing state
	let isDrawingStroke = false;
	let drawPoints: [number, number][] = []; // [lng, lat] pairs for mapbox
	let wasDrawing = false;

	// Location watch
	let watchId: number | null = null;
	let locationMarkerEl: HTMLDivElement | null = null;
	let locationMarker: mapboxgl.Marker | null = null;
	let locationAccuracyMarker: mapboxgl.Marker | null = null;

	// Beacon markers
	let beaconMarkers: mapboxgl.Marker[] = [];
	let beaconMidpointMarker: mapboxgl.Marker | null = null;

	export let pinMode = false;

	// ---------- GeoJSON circle helper ----------
	function circleGeoJSON(center: [number, number], radiusMeters: number) {
		const [lat, lng] = center;
		const points = 64;
		const R = 6371000;
		const coords = Array.from({ length: points + 1 }, (_, i) => {
			const angle = (i / points) * 2 * Math.PI;
			return [
				lng + (radiusMeters / R) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180) * Math.sin(angle),
				lat + (radiusMeters / R) * (180 / Math.PI) * Math.cos(angle)
			];
		});
		return {
			type: 'FeatureCollection' as const,
			features: [{
				type: 'Feature' as const,
				geometry: { type: 'Polygon' as const, coordinates: [coords] },
				properties: {}
			}]
		};
	}

	function lineGeoJSON(points: [number, number][]) {
		// points are [lng, lat]
		return {
			type: 'FeatureCollection' as const,
			features: points.length >= 2 ? [{
				type: 'Feature' as const,
				geometry: { type: 'LineString' as const, coordinates: points },
				properties: {}
			}] : []
		};
	}

	// ---------- Layer management helpers ----------
	function ensureSource(id: string, data: GeoJSON.GeoJSON) {
		if (!map) return;
		if (map.getSource(id)) {
			(map.getSource(id) as mapboxgl.GeoJSONSource).setData(data);
		} else {
			map.addSource(id, { type: 'geojson', data });
		}
	}

	function removeLayerAndSource(id: string) {
		if (!map) return;
		if (map.getLayer(id + '-fill')) map.removeLayer(id + '-fill');
		if (map.getLayer(id + '-line')) map.removeLayer(id + '-line');
		if (map.getLayer(id)) map.removeLayer(id);
		if (map.getSource(id)) map.removeSource(id);
	}

	// ---------- Route preview ----------
	function getRoutePreviewIds(layers: LayerState): Set<string> {
		const previewIds = new Set<string>();
		const places = $placesStore.places;
		const routePlaces: Record<string, Place[]> = {};
		for (const place of places) {
			if (place.route && layers.routes[place.route]) {
				if (!routePlaces[place.route]) routePlaces[place.route] = [];
				routePlaces[place.route].push(place);
			}
		}
		for (const routeName of Object.keys(routePlaces)) {
			const rPlaces = routePlaces[routeName];
			const numbered = rPlaces.filter(p => p.route_stop != null).sort((a, b) => a.route_stop! - b.route_stop!);
			if (numbered.length > 0) {
				previewIds.add(numbered[0].id);
			} else {
				previewIds.add(rPlaces[0].id);
			}
		}
		return previewIds;
	}

	// ---------- Tour line ----------
	function drawTourLine(routeName: string) {
		if (!map || !mb) return;
		const places = $placesStore.places
			.filter(p => p.route === routeName)
			.sort((a, b) => (a.route_stop ?? 999) - (b.route_stop ?? 999));
		if (places.length < 2) return;
		const color = getRouteColor(routeName);
		const coords = places.map(p => [p.longitude, p.latitude] as [number, number]);
		const data = lineGeoJSON(coords);
		ensureSource('tour-line', data);
		if (!map.getLayer('tour-line')) {
			map.addLayer({
				id: 'tour-line',
				type: 'line',
				source: 'tour-line',
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: {
					'line-color': color,
					'line-width': 4,
					'line-opacity': 0.7,
					'line-dasharray': [2, 3]
				}
			});
		}
	}

	function clearTourLine() {
		if (!map) return;
		removeLayerAndSource('tour-line');
	}

	// ---------- Visibility / display mode ----------
	function getDisplayMode(place: Place, layers: LayerState): 'route' | 'site' | 'hidden' {
		if ($routeBuilder.active && place.route === $routeBuilder.routeName && place.route_stop != null) {
			return 'route';
		}
		if ($beaconStore.active) {
			return beaconIdSet.has(place.id) ? 'site' : 'hidden';
		}
		if ($routeSearchStore.active) {
			if (!routeIdSet.has(place.id)) return 'hidden';
			return $routeSearchStore.mode === 'routes' ? 'route' : 'site';
		}
		if ($nearbyStore.active) {
			if (!nearbyIdSet.has(place.id)) return 'hidden';
			return $nearbyStore.mode === 'routes' ? 'route' : 'site';
		}
		if (layers.viewMode === 'routes') {
			if (place.route && layers.routes[place.route]) {
				if (expandedRoute === place.route) return 'route';
				if (routePreviewIds.has(place.id)) return 'route';
			}
			return 'hidden';
		}
		if (layers.viewMode === 'collections') {
			if (!place.collections || place.collections.length === 0) return 'hidden';
			for (const collection of place.collections) {
				if (layers.collections[collection.id]) return 'site';
			}
			return 'hidden';
		}
		if (layers.viewMode === 'sites') {
			return layers.sites[place.category] ? 'site' : 'hidden';
		}
		return 'hidden';
	}

	// ---------- Marker element creation ----------
	function createMarkerEl(place: Place, mode: 'route' | 'site', colorOverride?: string): HTMLDivElement {
		const el = document.createElement('div');
		el.style.cursor = 'pointer';

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
				el.style.width = '32px';
				el.style.height = '32px';
				el.style.position = 'relative';
				el.innerHTML = `<div style="
					width: 32px;
					height: 32px;
					background: ${color};
					border: 4px solid white;
					border-radius: 50% 50% 50% 0;
					transform: rotate(-45deg);
					box-shadow: 0 3px 8px rgba(0,0,0,0.4);
				"></div>${badge}`;
			} else {
				el.style.width = '16px';
				el.style.height = '16px';
				el.style.position = 'relative';
				el.innerHTML = `<div style="
					width: 16px;
					height: 16px;
					background: ${color};
					border: 2px solid white;
					border-radius: 50%;
					box-shadow: 0 2px 4px rgba(0,0,0,0.3);
					opacity: 0.85;
				"></div>${badge}`;
			}
			return el;
		}

		// Site mode
		const color = colorOverride || getCategoryColor(place.category);
		const isSite = place.priority === 'site';

		if (isSite) {
			el.style.width = '32px';
			el.style.height = '32px';
			el.innerHTML = `<div style="
				width: 32px;
				height: 32px;
				background: ${color};
				border: 4px solid white;
				border-radius: 50% 50% 50% 0;
				transform: rotate(-45deg);
				box-shadow: 0 3px 8px rgba(0,0,0,0.4);
			"></div>`;
		} else {
			el.style.width = '16px';
			el.style.height = '16px';
			el.innerHTML = `<div style="
				width: 16px;
				height: 16px;
				background: ${color};
				border: 2px solid white;
				border-radius: 50%;
				box-shadow: 0 2px 4px rgba(0,0,0,0.3);
				opacity: 0.85;
			"></div>`;
		}
		return el;
	}

	function handleMarkerClick(place: Place) {
		if (pinMode) return;
		const layers = $layerStore;
		if (layers.viewMode === 'routes' && place.route && !expandedRoute) {
			if (routePreviewIds.has(place.id)) {
				expandedRoute = place.route;
				drawTourLine(place.route);
				updateMarkers();
				return;
			}
		}
		selectedPlace.select(place);
	}

	// ---------- Marker add/update ----------
	function addMarker(place: Place) {
		if (!map || !mb) return;
		const layers = $layerStore;
		const mode = getDisplayMode(place, layers);
		const collectionColor = layers.viewMode === 'collections' && mode !== 'hidden'
			? getCollectionColor(place, layers) : undefined;

		if (markers.has(place.id)) {
			const entry = markers.get(place.id)!;
			if (mode === 'hidden') {
				if (entry.visible) {
					entry.marker.remove();
					entry.visible = false;
				}
			} else {
				// Update icon by replacing element content
				const newEl = createMarkerEl(place, mode, collectionColor);
				entry.el.innerHTML = newEl.innerHTML;
				entry.el.style.width = newEl.style.width;
				entry.el.style.height = newEl.style.height;
				if (!entry.visible) {
					entry.marker.addTo(map!);
					entry.visible = true;
				}
			}
			return;
		}

		// First time — create marker
		const el = createMarkerEl(place, mode === 'hidden' ? 'site' : mode, collectionColor);
		const anchor = place.priority === 'site' ? 'bottom-left' : 'center';
		const marker = new mb.Marker({ element: el, anchor })
			.setLngLat([place.longitude, place.latitude]);

		el.addEventListener('click', () => handleMarkerClick(place));

		const entry: MarkerEntry = { marker, el, visible: mode !== 'hidden' };
		markers.set(place.id, entry);

		if (mode !== 'hidden') {
			marker.addTo(map!);
		}
	}

	function updateMarkers() {
		if (!map || !mb) return;
		const layers = $layerStore;
		markers.forEach((entry, id) => {
			const place = $placesStore.places.find(p => p.id === id);
			if (!place) return;
			const mode = getDisplayMode(place, layers);
			if (mode === 'hidden') {
				if (entry.visible) {
					entry.marker.remove();
					entry.visible = false;
				}
			} else {
				const collectionColor = layers.viewMode === 'collections'
					? getCollectionColor(place, layers) : undefined;
				const newEl = createMarkerEl(place, mode, collectionColor);
				entry.el.innerHTML = newEl.innerHTML;
				entry.el.style.width = newEl.style.width;
				entry.el.style.height = newEl.style.height;
				if (!entry.visible) {
					entry.marker.addTo(map!);
					entry.visible = true;
				}
			}
		});
	}

	// ---------- Location ----------
	function updateLocationMarker(lat: number, lng: number, accuracy: number) {
		if (!map || !mb) return;

		// Accuracy circle
		const circleData = circleGeoJSON([lat, lng], accuracy);
		ensureSource('location-accuracy', circleData);
		if (!map.getLayer('location-accuracy-fill')) {
			map.addLayer({
				id: 'location-accuracy-fill',
				type: 'fill',
				source: 'location-accuracy',
				paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.1 }
			});
			map.addLayer({
				id: 'location-accuracy-line',
				type: 'line',
				source: 'location-accuracy',
				paint: { 'line-color': '#3b82f6', 'line-width': 1, 'line-opacity': 0.3 }
			});
		}

		// Location dot marker
		if (!locationMarker) {
			locationMarkerEl = document.createElement('div');
			locationMarkerEl.className = 'location-dot-wrap';
			locationMarkerEl.innerHTML = `<div class="location-dot">
				<div class="location-dot-inner"></div>
				<div class="location-dot-pulse"></div>
			</div>`;
			locationMarker = new mb.Marker({ element: locationMarkerEl, anchor: 'center' })
				.setLngLat([lng, lat])
				.addTo(map);
		} else {
			locationMarker.setLngLat([lng, lat]);
		}
	}

	function startLocationWatch() {
		if (!navigator.geolocation) return;
		watchId = navigator.geolocation.watchPosition(
			(pos) => updateLocationMarker(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
			(err) => console.warn('Geolocation error:', err.message),
			{ enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
		);
	}

	// ---------- Drawing ----------
	function getMapPoint(e: MouseEvent | TouchEvent): { lng: number; lat: number } | null {
		if (!map) return null;
		const rect = mapContainer.getBoundingClientRect();
		let clientX: number, clientY: number;
		if (e instanceof TouchEvent) {
			if (!e.touches[0]) return null;
			clientX = e.touches[0].clientX;
			clientY = e.touches[0].clientY;
		} else {
			clientX = e.clientX;
			clientY = e.clientY;
		}
		const x = clientX - rect.left;
		const y = clientY - rect.top;
		return map.unproject([x, y]);
	}

	function handleDrawStart(e: MouseEvent | TouchEvent) {
		if (!map || !$routeSearchStore.drawing) return;
		const pt = getMapPoint(e);
		if (!pt) return;
		isDrawingStroke = true;
		const coord: [number, number] = [pt.lng, pt.lat];
		if (drawPoints.length === 0) {
			drawPoints = [coord];
		} else {
			drawPoints.push(coord);
		}
		routeSearchStore.setLine(drawPoints.map(([lng, lat]) => [lat, lng]));
		updateDrawLine();
	}

	function handleDrawMove(e: MouseEvent | TouchEvent) {
		if (!map || !$routeSearchStore.drawing) return;
		if (!$routeSearchStore.painting && !isDrawingStroke) return;
		const pt = getMapPoint(e);
		if (!pt) return;
		const coord: [number, number] = [pt.lng, pt.lat];
		if (drawPoints.length === 0) {
			drawPoints = [coord];
		} else {
			const last = drawPoints[drawPoints.length - 1];
			const dx = (pt.lng - last[0]) * 111000;
			const dy = (pt.lat - last[1]) * 111000;
			if (Math.sqrt(dx * dx + dy * dy) < 20) return;
			drawPoints.push(coord);
		}
		routeSearchStore.setLine(drawPoints.map(([lng, lat]) => [lat, lng]));
		updateDrawLine();
	}

	function handleDrawEnd() {
		isDrawingStroke = false;
	}

	function updateDrawLine() {
		if (!map) return;
		const data = lineGeoJSON(drawPoints);
		ensureSource('draw-line', data);
		if (!map.getLayer('draw-line')) {
			map.addLayer({
				id: 'draw-line',
				type: 'line',
				source: 'draw-line',
				layout: { 'line-cap': 'round', 'line-join': 'round' },
				paint: { 'line-color': '#e94560', 'line-width': 4, 'line-opacity': 0.9 }
			});
		}
	}

	// ---------- Mount ----------
	onMount(async () => {
		const mapboxModule = await import('mapbox-gl');
		mb = mapboxModule.default;

		mb.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

		map = new mb.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [$mapStore.center[1], $mapStore.center[0]],
			zoom: $mapStore.zoom,
			attributionControl: false
		});

		map.addControl(new mb.AttributionControl({ compact: true }), 'bottom-right');
		map.addControl(new mb.NavigationControl({ showCompass: false }), 'bottom-right');

		map.on('moveend', () => {
			if (map) {
				const c = map.getCenter();
				mapStore.setCenter([c.lat, c.lng]);
			}
		});

		map.on('zoomend', () => {
			if (map) mapStore.setZoom(map.getZoom());
		});

		map.on('click', () => {
			if (expandedRoute) {
				expandedRoute = null;
				clearTourLine();
				updateMarkers();
			}
		});

		// Drawing event listeners
		mapContainer.addEventListener('mousedown', handleDrawStart);
		mapContainer.addEventListener('mousemove', handleDrawMove);
		mapContainer.addEventListener('mouseup', handleDrawEnd);
		mapContainer.addEventListener('mouseleave', handleDrawEnd);
		mapContainer.addEventListener('touchstart', handleDrawStart, { passive: true });
		mapContainer.addEventListener('touchmove', handleDrawMove, { passive: true });
		mapContainer.addEventListener('touchend', handleDrawEnd);

		// Fetch places and add DOM markers immediately — they don't need the style to load
		await placesStore.fetchAll();
		$placesStore.places.forEach(addMarker);

		startLocationWatch();

		// Wait for style to load so GeoJSON layers (circles, lines) work correctly
		// This is non-blocking for markers above
		if (!map.isStyleLoaded()) {
			await new Promise<void>(resolve => map!.once('load', () => resolve()));
		}
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
		markers.clear();
	});

	// ---------- Reactive statements ----------

	// Layer / viewMode changes
	$: if (map && mb && $layerStore && $nearbyStore && $routeSearchStore) {
		routePreviewIds = getRoutePreviewIds($layerStore);
		if ($layerStore.viewMode !== 'routes' || (expandedRoute && !$layerStore.routes[expandedRoute])) {
			expandedRoute = null;
			clearTourLine();
		}
		updateMarkers();
	}

	// Places data changes
	$: if (map && mb && $placesStore.places) {
		$placesStore.places.forEach(addMarker);
	}

	$: nearbyIdSet = $nearbyStore.active ? new Set($nearbyStore.placeIds) : new Set<string>();
	$: routeIdSet = $routeSearchStore.active ? new Set($routeSearchStore.placeIds) : new Set<string>();

	$: if ($beaconStore.active) {
		beaconIdSet = new Set($beaconStore.placeIds);
		if (map && mb) updateMarkers();
	} else {
		beaconIdSet = new Set();
	}

	// FlyTo
	$: if (map && mb && $mapStore.flyToTrigger > lastFlyToTrigger) {
		lastFlyToTrigger = $mapStore.flyToTrigger;
		map.flyTo({ center: [$mapStore.center[1], $mapStore.center[0]], zoom: $mapStore.zoom, duration: 800 });
	}

	// Drawing mode toggle
	$: if (map && mb) {
		if ($routeSearchStore.drawing) {
			if (!wasDrawing) drawPoints = [];
			map.dragPan.disable();
			map.dragRotate.disable();
			mapContainer.style.cursor = $routeSearchStore.painting ? 'crosshair' : '';
			wasDrawing = true;
		} else {
			map.dragPan.enable();
			map.dragRotate.enable();
			mapContainer.style.cursor = '';
			if (map.getLayer('draw-line')) map.removeLayer('draw-line');
			if (map.getSource('draw-line')) map.removeSource('draw-line');
			wasDrawing = false;
		}
	}

	// Nearby circle overlay
	$: if (map && mb) {
		if ($nearbyStore.active && $nearbyStore.center) {
			const data = circleGeoJSON($nearbyStore.center, $nearbyStore.radiusMeters);
			ensureSource('nearby-circle', data);
			if (!map.getLayer('nearby-circle-fill')) {
				map.addLayer({
					id: 'nearby-circle-fill',
					type: 'fill',
					source: 'nearby-circle',
					paint: { 'fill-color': '#e94560', 'fill-opacity': 0.1 }
				});
				map.addLayer({
					id: 'nearby-circle-line',
					type: 'line',
					source: 'nearby-circle',
					paint: { 'line-color': '#e94560', 'line-width': 2 }
				});
			}
		} else {
			if (map.getLayer('nearby-circle-fill')) map.removeLayer('nearby-circle-fill');
			if (map.getLayer('nearby-circle-line')) map.removeLayer('nearby-circle-line');
			if (map.getSource('nearby-circle')) map.removeSource('nearby-circle');
		}
	}

	// Beacon overlays
	$: if (map && mb) {
		// Remove old beacon markers
		beaconMarkers.forEach(m => m.remove());
		beaconMarkers = [];
		if (beaconMidpointMarker) { beaconMidpointMarker.remove(); beaconMidpointMarker = null; }
		if (map.getLayer('beacon-circle-fill')) map.removeLayer('beacon-circle-fill');
		if (map.getLayer('beacon-circle-line')) map.removeLayer('beacon-circle-line');
		if (map.getSource('beacon-circle')) map.removeSource('beacon-circle');

		if ($beaconStore.active && $beaconStore.midpoint && $beaconStore.beacon) {
			const beacon = $beaconStore.beacon;
			const midpoint = $beaconStore.midpoint;

			const makeFireEl = () => {
				const el = document.createElement('div');
				el.style.fontSize = '28px';
				el.style.lineHeight = '1';
				el.style.filter = 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))';
				el.textContent = '🔥';
				return el;
			};

			const creatorEl = makeFireEl();
			const creatorMarker = new mb!.Marker({ element: creatorEl, anchor: 'bottom' })
				.setLngLat([beacon.creator_lng, beacon.creator_lat])
				.addTo(map);
			beaconMarkers.push(creatorMarker);

			for (const p of beacon.participants) {
				const pEl = makeFireEl();
				const pMarker = new mb!.Marker({ element: pEl, anchor: 'bottom' })
					.setLngLat([p.lng, p.lat])
					.addTo(map);
				beaconMarkers.push(pMarker);
			}

			const midEl = document.createElement('div');
			midEl.style.width = '14px';
			midEl.style.height = '14px';
			midEl.style.background = '#f59e0b';
			midEl.style.border = '3px solid white';
			midEl.style.borderRadius = '50%';
			midEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.35)';
			beaconMidpointMarker = new mb!.Marker({ element: midEl, anchor: 'center' })
				.setLngLat([midpoint[1], midpoint[0]])
				.addTo(map);

			const beaconCircleData = circleGeoJSON(midpoint, 1000);
			ensureSource('beacon-circle', beaconCircleData);
			map.addLayer({
				id: 'beacon-circle-fill',
				type: 'fill',
				source: 'beacon-circle',
				paint: { 'fill-color': '#f59e0b', 'fill-opacity': 0.08 }
			});
			map.addLayer({
				id: 'beacon-circle-line',
				type: 'line',
				source: 'beacon-circle',
				paint: { 'line-color': '#f59e0b', 'line-width': 2 }
			});
		}
	}

	// Route search line overlay
	$: if (map && mb) {
		if ($routeSearchStore.drawing) {
			if (map.getLayer('route-line')) map.removeLayer('route-line');
			if (map.getSource('route-line')) map.removeSource('route-line');
		} else if ($routeSearchStore.line.length > 0) {
			// routeSearchStore.line is [lat, lng] — convert to [lng, lat] for mapbox
			const coords = $routeSearchStore.line.map(([lat, lng]) => [lng, lat] as [number, number]);
			const data = lineGeoJSON(coords);
			ensureSource('route-line', data);
			if (!map.getLayer('route-line')) {
				map.addLayer({
					id: 'route-line',
					type: 'line',
					source: 'route-line',
					layout: { 'line-cap': 'round', 'line-join': 'round' },
					paint: { 'line-color': '#111827', 'line-width': 4, 'line-opacity': 0.85 }
				});
			}
		} else {
			if (map.getLayer('route-line')) map.removeLayer('route-line');
			if (map.getSource('route-line')) map.removeSource('route-line');
		}
	}

	// Directions polyline
	$: if (map && mb) {
		if ($directionsStore.active && $directionsStore.result?.geometry) {
			// ORS returns [lng, lat] pairs
			const coords = $directionsStore.result.geometry as [number, number][];
			const data = lineGeoJSON(coords);
			ensureSource('directions-line', data);
			if (!map.getLayer('directions-line')) {
				map.addLayer({
					id: 'directions-line',
					type: 'line',
					source: 'directions-line',
					layout: { 'line-cap': 'round', 'line-join': 'round' },
					paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.8 }
				});
				// Fit map to route
				const lngs = coords.map(c => c[0]);
				const lats = coords.map(c => c[1]);
				map.fitBounds(
					[[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
					{ padding: 50 }
				);
			}
		} else {
			if (map.getLayer('directions-line')) map.removeLayer('directions-line');
			if (map.getSource('directions-line')) map.removeSource('directions-line');
		}
	}

	export function getMap(): mapboxgl.Map | null {
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

	:global(.mapboxgl-ctrl-group) {
		border: 1px solid var(--border) !important;
		box-shadow: var(--shadow-md) !important;
		border-radius: var(--radius-md) !important;
		overflow: hidden;
	}

	:global(.mapboxgl-ctrl-attrib) {
		font-size: 10px;
	}

	:global(.location-dot-wrap) {
		background: transparent;
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
