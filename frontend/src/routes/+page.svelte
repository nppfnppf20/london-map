<script lang="ts">
	import LeafletMap from '$components/map/LeafletMap.svelte';
	import LayerControl from '$components/layers/LayerControl.svelte';
	import PlaceDetail from '$components/ui/PlaceDetail.svelte';
	import AddPointModal from '$components/ui/AddPointModal.svelte';
	import CreateRouteModal from '$components/ui/CreateRouteModal.svelte';
	import RouteBanner from '$components/ui/RouteBanner.svelte';
	import { mapStore } from '$stores/map';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';

	let addModalOpen = $state(false);
	let routeModalOpen = $state(false);
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
		<div class="fab-group">
			<button class="fab fab-route" onclick={() => routeModalOpen = true} aria-label="Create route">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 17l4-4 4 4 4-4 4 4"/>
					<circle cx="5" cy="7" r="2"/>
					<circle cx="19" cy="7" r="2"/>
				</svg>
			</button>
			<button class="fab fab-add" onclick={startPinMode} aria-label="Add point">
				<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
					<path d="M12 5v14M5 12h14"/>
				</svg>
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

	<PlaceDetail place={$selectedPlace} onClose={() => selectedPlace.clear()} />
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
		bottom: calc(24px + env(safe-area-inset-bottom, 0px));
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
