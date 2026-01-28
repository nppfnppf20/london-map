<script lang="ts">
	import LeafletMap from '$components/map/LeafletMap.svelte';
	import LayerControl from '$components/layers/LayerControl.svelte';
	import PlaceDetail from '$components/ui/PlaceDetail.svelte';
	import AddPointModal from '$components/ui/AddPointModal.svelte';
	import { selectedPlace } from '$stores/selected';

	let addModalOpen = $state(false);
</script>

<svelte:head>
	<title>London App - Discover London</title>
</svelte:head>

<main class="map-page">
	<LeafletMap />
	<LayerControl />

	<button class="fab" onclick={() => addModalOpen = true} aria-label="Add point">
		<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
			<path d="M12 5v14M5 12h14"/>
		</svg>
	</button>

	<PlaceDetail place={$selectedPlace} onClose={() => selectedPlace.clear()} />
	<AddPointModal open={addModalOpen} onClose={() => addModalOpen = false} />
</main>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.fab {
		position: absolute;
		bottom: calc(120px + env(safe-area-inset-bottom, 0px));
		right: calc(var(--spacing-md) + env(safe-area-inset-right, 0px));
		z-index: 1000;
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: var(--color-highlight);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
		transition: transform 0.15s ease-out;
		-webkit-tap-highlight-color: transparent;
	}

	.fab:active {
		transform: scale(0.92);
	}
</style>
