<script lang="ts">
	import LeafletMap from '$components/map/LeafletMap.svelte';
	import LayerControl from '$components/layers/LayerControl.svelte';
	import PlaceDetail from '$components/ui/PlaceDetail.svelte';
	import AddPointModal from '$components/ui/AddPointModal.svelte';
	import CreateRouteModal from '$components/ui/CreateRouteModal.svelte';
	import RouteBanner from '$components/ui/RouteBanner.svelte';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';

	let addModalOpen = $state(false);
	let routeModalOpen = $state(false);
</script>

<svelte:head>
	<title>London App - Discover London</title>
</svelte:head>

<main class="map-page">
	<LeafletMap />
	<LayerControl />
	<RouteBanner />

	{#if !$routeBuilder.active}
		<div class="fab-group">
			<button class="fab fab-route" onclick={() => routeModalOpen = true} aria-label="Create route">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 17l4-4 4 4 4-4 4 4"/>
					<circle cx="5" cy="7" r="2"/>
					<circle cx="19" cy="7" r="2"/>
				</svg>
			</button>
			<button class="fab fab-add" onclick={() => addModalOpen = true} aria-label="Add point">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
					<path d="M12 5v14M5 12h14"/>
				</svg>
			</button>
		</div>
	{/if}

	<PlaceDetail place={$selectedPlace} onClose={() => selectedPlace.clear()} />
	<AddPointModal open={addModalOpen} onClose={() => addModalOpen = false} />
	<CreateRouteModal open={routeModalOpen} onClose={() => routeModalOpen = false} />
</main>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.fab-group {
		position: absolute;
		bottom: calc(120px + env(safe-area-inset-bottom, 0px));
		right: calc(var(--spacing-md) + env(safe-area-inset-right, 0px));
		z-index: 1000;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		align-items: center;
	}

	.fab {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s ease-out;
		-webkit-tap-highlight-color: transparent;
	}

	.fab:active {
		transform: scale(0.92);
	}

	.fab-add {
		background: var(--color-highlight);
		box-shadow: 0 4px 12px rgba(233, 69, 96, 0.4);
	}

	.fab-route {
		width: 44px;
		height: 44px;
		background: var(--color-accent);
		box-shadow: 0 4px 12px rgba(15, 52, 96, 0.3);
	}
</style>
