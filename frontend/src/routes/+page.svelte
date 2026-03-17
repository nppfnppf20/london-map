<script lang="ts">
	import LeafletMap from '$components/map/LeafletMap.svelte';
	import LayerControl from '$components/layers/LayerControl.svelte';
	import PlaceDetail from '$components/ui/PlaceDetail.svelte';
	import AddPointModal from '$components/ui/AddPointModal.svelte';
	import AddSiteToModal from '$components/ui/AddSiteToModal.svelte';
	import NearbySearchModal from '$components/ui/NearbySearchModal.svelte';
	import NearbyControl from '$components/ui/NearbyControl.svelte';
	import CreateRouteModal from '$components/ui/CreateRouteModal.svelte';
	import RouteBanner from '$components/ui/RouteBanner.svelte';
	import RoutePlaceDetail from '$components/ui/RoutePlaceDetail.svelte';
	import { mapStore } from '$stores/map';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';

	let addModalOpen = $state(false);
	let routeModalOpen = $state(false);
	let addSiteToOpen = $state(false);
	let nearbyModalOpen = $state(false);
	let pinMode = $state(false);
	let pinCoords = $state<[number, number] | null>(null);
	let pinAction = $state<'add' | 'nearby' | null>(null);

	function startPinMode(action: 'add' | 'nearby') {
		selectedPlace.clear();
		pinMode = true;
		pinAction = action;
	}

	function cancelPinMode() {
		pinMode = false;
		pinCoords = null;
		pinAction = null;
	}

	function confirmPinMode() {
		pinCoords = $mapStore.center;
		pinMode = false;
		if (pinAction === 'add') {
			addModalOpen = true;
		}
		if (pinAction === 'nearby') {
			nearbyModalOpen = true;
		}
		pinAction = null;
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
			<button class="bar-btn primary" onclick={() => startPinMode('add')} aria-label="Add point">
				Add site
			</button>
			<button class="bar-btn secondary" onclick={() => routeModalOpen = true} aria-label="Create route">
				Create route
			</button>
			<button class="bar-btn secondary" onclick={() => startPinMode('nearby')} aria-label="Find near me">
				Find near me
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
	<NearbySearchModal
		open={nearbyModalOpen}
		center={pinCoords}
		onClose={() => {
			nearbyModalOpen = false;
			pinCoords = null;
		}}
	/>
	<NearbyControl onEdit={() => { nearbyModalOpen = true; }} />
	<CreateRouteModal open={routeModalOpen} onClose={() => routeModalOpen = false} />
</main>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		--bottom-bar-height: 68px;
	}

	.bottom-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 1100;
		display: flex;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-md) calc(var(--spacing-sm) + env(safe-area-inset-bottom, 0px));
		background: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-top: 1px solid var(--border);
		box-shadow: 0 -4px 24px rgba(60, 50, 40, 0.08);
	}

	.bar-btn {
		flex: 1;
		padding: 13px 14px;
		border-radius: var(--radius-md);
		font-family: var(--font-ui);
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0.01em;
		-webkit-tap-highlight-color: transparent;
		transition: opacity 0.15s ease;
	}

	.bar-btn.primary {
		background: var(--accent);
		color: white;
		box-shadow: 0 2px 12px rgba(233, 69, 96, 0.3);
	}

	.bar-btn.secondary {
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.bar-btn:active {
		opacity: 0.82;
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
		background: var(--accent);
		border: 3px solid white;
		border-radius: 50% 50% 50% 0;
		transform: translate(-50%, -100%) rotate(-45deg);
		box-shadow: 0 4px 16px rgba(233, 69, 96, 0.45);
	}

	.pin-panel {
		position: absolute;
		bottom: calc(var(--bottom-bar-height) + env(safe-area-inset-bottom, 0px) + 12px);
		left: 50%;
		transform: translateX(-50%);
		background: var(--surface);
		padding: var(--spacing-md) var(--spacing-lg);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-xl);
		text-align: center;
		max-width: min(340px, 90vw);
		pointer-events: auto;
		border: 1px solid var(--border);
	}

	.pin-title {
		margin: 0 0 4px;
		font-family: var(--font-display);
		font-size: 18px;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--text);
	}

	.pin-help {
		margin: 0 0 var(--spacing-md);
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.5;
	}

	.pin-actions {
		display: flex;
		gap: var(--spacing-sm);
	}

	.pin-btn {
		flex: 1;
		padding: 11px 12px;
		border-radius: var(--radius-md);
		font-family: var(--font-ui);
		font-size: 14px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
		pointer-events: auto;
		transition: opacity 0.15s ease;
	}

	.pin-btn.primary {
		background: var(--accent);
		color: white;
	}

	.pin-btn.secondary {
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.pin-btn:active {
		opacity: 0.82;
	}
</style>
