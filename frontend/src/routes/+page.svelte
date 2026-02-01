<script lang="ts">
	import LeafletMap from '$components/map/LeafletMap.svelte';
	import LayerControl from '$components/layers/LayerControl.svelte';
	import PlaceDetail from '$components/ui/PlaceDetail.svelte';
	import AddPointModal from '$components/ui/AddPointModal.svelte';
	import AddSiteToModal from '$components/ui/AddSiteToModal.svelte';
	import NearbySearchModal from '$components/ui/NearbySearchModal.svelte';
	import NearbyControl from '$components/ui/NearbyControl.svelte';
	import RouteSearchModal from '$components/ui/RouteSearchModal.svelte';
	import RouteSearchControl from '$components/ui/RouteSearchControl.svelte';
	import CreateRouteModal from '$components/ui/CreateRouteModal.svelte';
	import RouteBanner from '$components/ui/RouteBanner.svelte';
	import RoutePlaceDetail from '$components/ui/RoutePlaceDetail.svelte';
	import { mapStore } from '$stores/map';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';
	import { routeSearchStore } from '$stores/routeSearch';
	import { nearbyStore } from '$stores/nearby';

	let addModalOpen = $state(false);
	let routeModalOpen = $state(false);
	let addSiteToOpen = $state(false);
	let nearbyModalOpen = $state(false);
	let routeSearchModalOpen = $state(false);
	let addMenuOpen = $state(false);
	let exploreMenuOpen = $state(false);
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

	function closeMenus() {
		addMenuOpen = false;
		exploreMenuOpen = false;
	}
</script>

<svelte:head>
	<title>London App - Discover London</title>
</svelte:head>

<main class="map-page">
	<LeafletMap pinMode={pinMode} />
	<LayerControl />
	<RouteBanner />

	{#if $routeSearchStore.drawing}
		<button
			class="draw-fab"
			class:active={$routeSearchStore.painting}
			aria-label="Draw route"
			onclick={() => {
				routeSearchStore.togglePainting();
			}}
		>
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 20h9"/>
				<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
			</svg>
		</button>
	{/if}

	{#if !$routeBuilder.active}
		<div class="bottom-bar">
			<div class="menu-stack">
				{#if exploreMenuOpen}
					<div class="action-menu">
						<button
							class="menu-item ui-btn ui-btn-secondary"
							onclick={() => {
								closeMenus();
								startPinMode('nearby');
							}}
						>
							Find near me
						</button>
						<button
							class="menu-item ui-btn ui-btn-secondary"
							onclick={() => {
								closeMenus();
								nearbyStore.clear();
								routeSearchStore.startDrawing();
							}}
						>
							Find along route
						</button>
					</div>
				{/if}
				<button
					class="bar-btn ui-btn ui-btn-secondary"
					onclick={() => {
						addMenuOpen = false;
						exploreMenuOpen = !exploreMenuOpen;
					}}
					aria-label="Explore"
				>
					Explore
				</button>
			</div>
			<div class="menu-stack">
				{#if addMenuOpen}
					<div class="action-menu">
						<button
							class="menu-item ui-btn ui-btn-secondary"
							onclick={() => {
								closeMenus();
								startPinMode('add');
							}}
						>
							Add site
						</button>
						<button
							class="menu-item ui-btn ui-btn-secondary"
							onclick={() => {
								closeMenus();
								routeModalOpen = true;
							}}
						>
							Create route
						</button>
					</div>
				{/if}
				<button
					class="bar-btn primary ui-btn"
					onclick={() => {
						exploreMenuOpen = false;
						addMenuOpen = !addMenuOpen;
					}}
					aria-label="Add"
				>
					Add
				</button>
			</div>
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

	{#if $routeSearchStore.drawing}
		<div class="pin-overlay">
			<div class="pin-panel">
				<p class="pin-title">Draw your route</p>
				<p class="pin-help">Press and drag to sketch the route. Lift to finish.</p>
				<div class="pin-actions">
					<button
						class="pin-btn secondary"
						onclick={() => {
							routeSearchStore.clear();
						}}
					>
						Cancel
					</button>
					<button
						class="pin-btn primary"
						onclick={() => {
							routeSearchStore.finishDrawing();
							routeSearchModalOpen = true;
						}}
					>
						Use this route
					</button>
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
	<RouteSearchModal
		open={routeSearchModalOpen}
		onClose={() => {
			routeSearchModalOpen = false;
		}}
	/>
	<RouteSearchControl
		onEdit={() => { routeSearchModalOpen = true; }}
		onRedraw={() => {
			nearbyStore.clear();
			routeSearchStore.startDrawing();
		}}
	/>
	<CreateRouteModal open={routeModalOpen} onClose={() => routeModalOpen = false} />
</main>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		--bottom-bar-height: 64px;
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
		background: white;
		border-top: 1px solid #e5e7eb;
		box-shadow: 0 -10px 20px rgba(0, 0, 0, 0.08);
	}

	.menu-stack {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.bar-btn {
		width: 100%;
	}

	.bar-btn.primary {
		background: var(--color-highlight);
		color: white;
	}

	.action-menu {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
		background: white;
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
		box-shadow: var(--shadow-lg);
	}

	.menu-item {
		width: 100%;
		text-align: left;
		font-size: 14px;
	}

	.menu-item:active {
		opacity: 0.9;
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
		bottom: calc(var(--bottom-bar-height) + env(safe-area-inset-bottom, 0px) + 12px);
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

	.draw-fab {
		position: absolute;
		right: calc(var(--spacing-md) + env(safe-area-inset-right, 0px));
		bottom: calc(var(--bottom-bar-height) + env(safe-area-inset-bottom, 0px) + 72px);
		z-index: 1100;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: white;
		color: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-lg);
		-webkit-tap-highlight-color: transparent;
	}

	.draw-fab:active {
		transform: scale(0.96);
	}

	.draw-fab.active {
		background: var(--color-highlight);
		color: white;
	}
</style>
