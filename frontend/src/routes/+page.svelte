<script lang="ts">
	import LeafletMap from '$components/map/LeafletMap.svelte';
	import LayerControl from '$components/layers/LayerControl.svelte';
	import PlaceDetail from '$components/ui/PlaceDetail.svelte';
	import { selectedPlace } from '$stores/selected';
</script>

<svelte:head>
	<title>London App - Discover London</title>
</svelte:head>

<main class="map-page">
	<LeafletMap />
	<LayerControl />
	<PlaceDetail place={$selectedPlace} onClose={() => selectedPlace.clear()} />
</main>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100%;
	}
</style>
