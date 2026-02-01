<script lang="ts">
	import LeafletMap from '$components/map/LeafletMap.svelte';
	import LayerControl from '$components/layers/LayerControl.svelte';
	import PlaceDetail from '$components/ui/PlaceDetail.svelte';
	import AddPointModal from '$components/ui/AddPointModal.svelte';
	import AddSiteToModal from '$components/ui/AddSiteToModal.svelte';
	import CreateRouteModal from '$components/ui/CreateRouteModal.svelte';
	import RouteBanner from '$components/ui/RouteBanner.svelte';
	import RoutePlaceDetail from '$components/ui/RoutePlaceDetail.svelte';
	import { mapStore } from '$stores/map';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';

	let addModalOpen = $state(false);
	let routeModalOpen = $state(false);
	let addSiteToOpen = $state(false);
	let pinMode = $state(false);
	let pinCoords = $state<[number, number] | null>(null);

	function startPinMode() {
		selectedPlace.clear();
		pinMode = true;
	}

	function cancelPinMode() {
		pinMode = false;
		pinCoords = null;
	}

	function confirmPinMode() {
		pinCoords = $mapStore.center;
		pinMode = false;
		addModalOpen = true;
	}
</script>

<svelte:head>
	<title>London App - Discover London</title>
</svelte:head>

<main class="map-page">
	<LeafletMap pinMode={pinMode} />
	<LayerControl />
	<RouteBanner />

	{#if !$routeBuilder.active}
		<div class="bottom-bar">
			<button class="bar-btn primary" onclick={startPinMode} aria-label="Add point">
				Add site
			</button>
			<button class="bar-btn secondary" onclick={() => routeModalOpen = true} aria-label="Create route">
				Create route
			</button>
		</div>
	{/if}

	{#if pinMode}
		<div class="pin-overlay">
			<div class="pin-marker" aria-hidden="true"></div>
			<div class="pin-panel">
				<p class="pin-title">Place the pin</p>
				<p class="pin-help">Drag the map to position the pin, or tap to jump.</p>
				<div class="pin-actions">
					<button class="pin-btn secondary" onclick={cancelPinMode}>Cancel</button>
					<button class="pin-btn primary" onclick={confirmPinMode}>Use this spot</button>
				</div>
			</div>
		</div>
	{/if}

	<PlaceDetail
		place={$routeBuilder.active ? null : $selectedPlace}
		onClose={() => selectedPlace.clear()}
		onAddTo={() => {
			addSiteToOpen = true;
		}}
	/>
	<RoutePlaceDetail
		place={$routeBuilder.active ? $selectedPlace : null}
		onClose={() => selectedPlace.clear()}
		onAddToRoute={(place) => {
			routeBuilder.addStop(place.id);
			selectedPlace.clear();
		}}
	/>
	<AddSiteToModal
		open={addSiteToOpen}
		place={$selectedPlace}
		onClose={() => { addSiteToOpen = false; }}
	/>
	<AddPointModal
		open={addModalOpen}
		coords={pinCoords}
		onCreateRoute={() => {
			addModalOpen = false;
			routeModalOpen = true;
		}}
		onClose={() => {
			addModalOpen = false;
			pinCoords = null;
		}}
	/>
	<CreateRouteModal open={routeModalOpen} onClose={() => routeModalOpen = false} />
</main>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.bottom-bar {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1100;
		display: flex;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md) calc(var(--spacing-sm) + env(safe-area-inset-bottom, 0px));
		background: white;
		border-top: 1px solid #e5e7eb;
		box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.08);
	}

	.bar-btn {
		flex: 1;
		padding: 12px 14px;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-weight: 700;
		-webkit-tap-highlight-color: transparent;
	}

	.bar-btn.primary {
		background: var(--color-highlight);
		color: white;
	}

	.bar-btn.secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.pin-overlay {
		position: absolute;
		inset: 0;
		z-index: 1200;
		pointer-events: none;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.pin-marker {
		position: absolute;
		left: 50%;
		top: 50%;
		width: 24px;
		height: 24px;
		background: var(--color-highlight);
		border: 3px solid white;
		border-radius: 50% 50% 50% 0;
		transform: translate(-50%, -100%) rotate(-45deg);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
	}

	.pin-panel {
		position: absolute;
		bottom: calc(68px + env(safe-area-inset-bottom, 0px) + 12px);
		left: 50%;
		transform: translateX(-50%);
		background: white;
		padding: var(--spacing-md);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		text-align: center;
		max-width: min(340px, 90vw);
		pointer-events: auto;
	}

	.pin-title {
		margin: 0 0 4px;
		font-size: 16px;
		font-weight: 700;
		color: var(--color-primary);
	}

	.pin-help {
		margin: 0 0 var(--spacing-sm);
		font-size: 13px;
		color: #6b7280;
	}

	.pin-actions {
		display: flex;
		gap: var(--spacing-sm);
	}

	.pin-btn {
		flex: 1;
		padding: 10px 12px;
		border-radius: var(--radius-md);
		font-size: 14px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
		pointer-events: auto;
	}

	.pin-btn.primary {
		background: var(--color-highlight);
		color: white;
	}

	.pin-btn.secondary {
		background: #f3f4f6;
		color: #374151;
	}

	.pin-btn:active {
		opacity: 0.85;
	}
</style>
