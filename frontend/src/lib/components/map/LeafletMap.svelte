<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { mapStore } from '$stores/map';
	import { layerStore } from '$stores/layers';
	import { placesStore } from '$stores/places';
	import { nearbyStore } from '$stores/nearby';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';
	import { getCategoryColor, getRouteColor } from '$utils/map-helpers';
	import type { Place, LayerState } from '$types';
	import type mapboxgl from 'mapbox-gl';

	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map | null = null;
	let mb: typeof mapboxgl | null = null;

	type MarkerEntry = { marker: mapboxgl.Marker; el: HTMLDivElement; visible: boolean };
	let markers: Map<string, MarkerEntry> = new Map();
	let nearbyIdSet = new Set<string>();

	let pinClickHandler: ((e: mapboxgl.MapMouseEvent) => void) | null = null;

	export let pinMode = false;

	function getDisplayMode(place: Place, layers: LayerState): 'route' | 'site' | 'hidden' {
		if ($routeBuilder.active && place.route === $routeBuilder.routeName && place.route_stop != null) {
			return 'route';
		}

		if ($nearbyStore.active) {
			if (!nearbyIdSet.has(place.id)) return 'hidden';
			return $nearbyStore.mode === 'routes' ? 'route' : 'site';
		}

		if (layers.viewMode === 'routes') {
			return place.route && layers.routes[place.route] ? 'route' : 'hidden';
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

	function getMarkerHTML(place: Place, mode: 'route' | 'site'): string {
		if (mode === 'route') {
			const color = getRouteColor(place.route);
			const isSite = place.priority === 'site';

			let badge = '';
			if (place.route_stop != null) {
				badge = `<div style="position:absolute;top:-8px;right:-8px;width:20px;height:20px;background:white;color:${color};border-radius:50%;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.3);line-height:1;">${place.route_stop}</div>`;
			}

			if (isSite) {
				return `<div style="position:relative"><div style="width:32px;height:32px;background:${color};border:4px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.4);"></div>${badge}</div>`;
			}

			return `<div style="position:relative"><div style="width:16px;height:16px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);opacity:0.85;"></div>${badge}</div>`;
		}

		const color = getCategoryColor(place.category);
		const isSite = place.priority === 'site';

		if (isSite) {
			return `<div style="width:32px;height:32px;background:${color};border:4px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.4);"></div>`;
		}

		return `<div style="width:16px;height:16px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);opacity:0.85;"></div>`;
	}

	function handleMarkerClick(place: Place) {
		if (pinMode) return;
		selectedPlace.select(place);
	}

	function addMarker(place: Place) {
		if (!map || !mb) return;

		const mode = getDisplayMode(place, $layerStore);

		if (markers.has(place.id)) {
			const entry = markers.get(place.id)!;
			entry.el.innerHTML = getMarkerHTML(place, mode === 'hidden' ? 'site' : mode);

			if (mode === 'hidden') {
				if (entry.visible) {
					entry.marker.remove();
					entry.visible = false;
				}
			} else {
				if (!entry.visible) {
					entry.marker.addTo(map);
					entry.visible = true;
				}
			}
			return;
		}

		const el = document.createElement('div');
		el.style.cssText = 'cursor:pointer;';
		if (place.priority === 'site') el.style.zIndex = '1000';
		el.innerHTML = getMarkerHTML(place, mode === 'hidden' ? 'site' : mode);
		el.addEventListener('click', (e) => {
			e.stopPropagation();
			handleMarkerClick(place);
		});

		const anchor: mapboxgl.Anchor = place.priority === 'site' ? 'bottom' : 'center';
		const marker = new mb.Marker({ element: el, anchor })
			.setLngLat([place.longitude, place.latitude]);

		const entry: MarkerEntry = { marker, el, visible: false };
		markers.set(place.id, entry);

		if (mode !== 'hidden') {
			marker.addTo(map);
			entry.visible = true;
		}
	}

	function updateMarkers() {
		if (!map) return;

		markers.forEach((entry, id) => {
			const place = $placesStore.places.find(p => p.id === id);
			if (!place) return;

			const mode = getDisplayMode(place, $layerStore);
			entry.el.innerHTML = getMarkerHTML(place, mode === 'hidden' ? 'site' : mode);

			if (mode === 'hidden') {
				if (entry.visible) {
					entry.marker.remove();
					entry.visible = false;
				}
			} else {
				if (!entry.visible) {
					entry.marker.addTo(map!);
					entry.visible = true;
				}
			}
		});
	}

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

	function updateNearbyCircle() {
		if (!map || !map.isStyleLoaded()) return;

		if ($nearbyStore.active && $nearbyStore.center) {
			const data = circleGeoJSON($nearbyStore.center, $nearbyStore.radiusMeters);
			const source = map.getSource('nearby-circle') as mapboxgl.GeoJSONSource | undefined;
			if (source) {
				source.setData(data);
			} else {
				map.addSource('nearby-circle', { type: 'geojson', data });
				map.addLayer({ id: 'nearby-circle-fill', type: 'fill', source: 'nearby-circle', paint: { 'fill-color': '#e94560', 'fill-opacity': 0.1 } });
				map.addLayer({ id: 'nearby-circle-line', type: 'line', source: 'nearby-circle', paint: { 'line-color': '#e94560', 'line-width': 2 } });
			}
		} else {
			if (map.getLayer('nearby-circle-fill')) map.removeLayer('nearby-circle-fill');
			if (map.getLayer('nearby-circle-line')) map.removeLayer('nearby-circle-line');
			if (map.getSource('nearby-circle')) map.removeSource('nearby-circle');
		}
	}

	function setPinClickHandling() {
		if (!map) return;
		if (pinMode) {
			if (!pinClickHandler) {
				pinClickHandler = (e: mapboxgl.MapMouseEvent) => {
					map!.panTo(e.lngLat, { animate: true });
				};
			}
			map.on('click', pinClickHandler);
		} else if (pinClickHandler) {
			map.off('click', pinClickHandler);
		}
	}

	onMount(async () => {
		const mapboxModule = await import('mapbox-gl');
		mb = mapboxModule.default;
		mb.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

		map = new mb.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/streets-v12',
			center: [$mapStore.center[1], $mapStore.center[0]],
			zoom: $mapStore.zoom,
			attributionControl: true
		});

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

		// Wait for style to load before fetching places
		await new Promise<void>(resolve => map!.once('load', resolve));

		await placesStore.fetchAll();
		$placesStore.places.forEach(addMarker);
	});

	onDestroy(() => {
		markers.forEach(({ marker }) => marker.remove());
		markers.clear();
		if (map) {
			map.remove();
			map = null;
		}
	});

	// React to layer/nearby changes — mb acts as the readiness guard (set once map module loads)
	$: if (map && mb && $layerStore && $nearbyStore) updateMarkers();

	// React to place data changes
	$: if (map && mb && $placesStore.places) $placesStore.places.forEach(addMarker);

	// Sync nearbyIdSet before updateMarkers reads it
	$: if ($nearbyStore.active) {
		nearbyIdSet = new Set($nearbyStore.placeIds);
	} else {
		nearbyIdSet = new Set();
	}

	// Nearby circle (guards itself with isStyleLoaded)
	$: if (map && mb && $nearbyStore) updateNearbyCircle();

	// Enable/disable pin click behaviour
	$: if (map) setPinClickHandling();

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

	:global(.mapboxgl-ctrl-bottom-right) {
		margin-bottom: calc(var(--bottom-bar-height, 0px) + env(safe-area-inset-bottom, 0px) + var(--spacing-md)) !important;
		margin-right: var(--spacing-md) !important;
	}

	:global(.mapboxgl-ctrl-group) {
		border: none !important;
		box-shadow: var(--shadow-md) !important;
	}

	:global(.mapboxgl-ctrl-group button) {
		width: 44px !important;
		height: 44px !important;
	}

	:global(.mapboxgl-ctrl-attrib) {
		font-size: 10px;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}
</style>
