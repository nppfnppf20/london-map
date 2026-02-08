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
	import SearchBar from '$components/ui/SearchBar.svelte';
	import AuthModal from '$components/ui/AuthModal.svelte';
	import MenuNav from '$components/ui/MenuNav.svelte';
	import { mapStore } from '$stores/map';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';
	import { routeSearchStore } from '$stores/routeSearch';
	import { nearbyStore } from '$stores/nearby';
	import { directionsStore, formatDuration, formatDistance } from '$stores/directions';
	import { authStore } from '$stores/auth';
	import { CATEGORY_LABELS, CATEGORY_COLORS } from '$utils/map-helpers';

	let authModalOpen = $state(false);
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
	let menuTab = $state<'Places' | 'Lists' | 'Tours'>('Lists');

	const LONDON_CENTER: [number, number] = [51.5074, -0.1278];
	const PLACE_ITEMS = [
		{ name: 'St Pauls Cathedral', category: 'history', lat: 51.5138, lng: -0.0984, contributor: 'Jamie' },
		{ name: 'Borough Market', category: 'food', lat: 51.5055, lng: -0.0910, contributor: 'Nora' },
		{ name: 'Somerset House', category: 'architecture', lat: 51.5116, lng: -0.1177, contributor: 'Alex' },
		{ name: 'The Lamb & Flag', category: 'pub', lat: 51.5144, lng: -0.1256, contributor: 'Priya' }
	] as const;

	function toRadians(value: number): number {
		return (value * Math.PI) / 180;
	}

	function distanceMeters(from: [number, number], to: [number, number]): number {
		const [lat1, lon1] = from;
		const [lat2, lon2] = to;
		const r = 6371000;
		const dLat = toRadians(lat2 - lat1);
		const dLon = toRadians(lon2 - lon1);
		const a =
			Math.sin(dLat / 2) * Math.sin(dLat / 2) +
			Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
				Math.sin(dLon / 2) * Math.sin(dLon / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return r * c;
	}


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
	<section class="map-pane">
		<LeafletMap pinMode={pinMode} />
		<LayerControl />
		<RouteBanner />
		{#if !pinMode && !$routeSearchStore.drawing}
			<SearchBar />
		{/if}

		{#if !pinMode && !$routeSearchStore.drawing}
			<button
				class="auth-btn"
				onclick={() => {
					if ($authStore.user) {
						authStore.signOut();
					} else {
						authModalOpen = true;
					}
				}}
				aria-label={$authStore.user ? 'Sign out' : 'Sign in'}
			>
				{#if $authStore.user}
					<span class="auth-avatar">
						{$authStore.user.email.charAt(0).toUpperCase()}
					</span>
				{:else}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
						<circle cx="12" cy="7" r="4"/>
					</svg>
				{/if}
			</button>
		{/if}

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

		<button class="map-plus-btn" type="button" aria-label="Add">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M12 5v14" />
				<path d="M5 12h14" />
			</svg>
		</button>
	</section>

	<section class="menu-pane">
		<div class="menu-surface">
			<div class="menu-grip" aria-hidden="true"></div>
			<MenuNav value={menuTab} onSelect={(tab) => { menuTab = tab; }} />
			<div class="menu-list">
				{#if menuTab === 'Places'}
					{#each PLACE_ITEMS as place}
						<div class="menu-item-card">
							<div class="menu-item-main">
								<p class="menu-item-name">
									<span class="menu-item-dot" style={`background:${CATEGORY_COLORS[place.category]}`}></span>
									{place.name}
								</p>
								<p class="menu-item-meta">
									<span>{CATEGORY_LABELS[place.category]}</span>
									<span>&middot;</span>
									<span>{formatDistance(distanceMeters(LONDON_CENTER, [place.lat, place.lng]))}</span>
								</p>
							</div>
							<p class="menu-item-contrib">By {place.contributor}</p>
						</div>
					{/each}
				{:else if menuTab === 'Lists'}
					<div class="menu-item-card">
						<div class="menu-item-main">
							<p class="menu-item-name">John Voyage Pubs</p>
							<p class="menu-item-meta">By Sam Baker</p>
						</div>
					</div>
					<div class="menu-item-card">
						<div class="menu-item-main">
							<p class="menu-item-name">The Shamans Pubs</p>
							<p class="menu-item-meta">By Jack Shearman</p>
						</div>
					</div>
					<div class="menu-item-card">
						<div class="menu-item-main">
							<p class="menu-item-name">Restaurants</p>
							<p class="menu-item-meta">By Stan</p>
						</div>
					</div>
				{:else}
					<div class="menu-item-placeholder"></div>
					<div class="menu-item-placeholder"></div>
					<div class="menu-item-placeholder"></div>
				{/if}
			</div>
		</div>

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
	</section>

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

	{#if $directionsStore.active && $directionsStore.result}
		<div class="directions-banner">
			<div class="directions-banner-info">
				<span class="directions-banner-label">
					{$directionsStore.destination?.name || 'Destination'}
				</span>
				<span class="directions-banner-stats">
					{formatDuration($directionsStore.result.duration)} &middot; {formatDistance($directionsStore.result.distance)}
				</span>
			</div>
			<button class="directions-banner-clear" onclick={() => directionsStore.clear()}>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12"/>
				</svg>
			</button>
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
	<AuthModal open={authModalOpen} onClose={() => authModalOpen = false} />
</main>

<style>
	.map-page {
		position: relative;
		width: 100%;
		height: 100dvh;
		min-height: 100dvh;
		--bottom-bar-height: 64px;
		display: flex;
		flex-direction: column;
		background: #f3f4f6;
	}

	.map-pane {
		position: relative;
		flex: 0 0 50dvh;
		min-height: 50dvh;
		overflow: hidden;
	}

	.menu-pane {
		position: relative;
		flex: 0 0 50dvh;
		min-height: 50dvh;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: var(--spacing-md) var(--spacing-md) calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
		background: white;
		border-top-left-radius: 24px;
		border-top-right-radius: 24px;
		box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.12);
	}

	.menu-surface {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.menu-grip {
		width: 54px;
		height: 6px;
		border-radius: 999px;
		background: #e5e7eb;
		align-self: center;
	}

	.menu-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.menu-item-placeholder {
		height: 56px;
		border-radius: 16px;
		background: #f3f4f6;
	}

	.menu-item-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		padding: 12px 16px;
		border-radius: 16px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
	}

	.menu-item-main {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.menu-item-name {
		margin: 0;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 700;
		color: #0f172a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.menu-item-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		flex-shrink: 0;
	}

	.menu-item-meta {
		margin: 0;
		display: inline-flex;
		gap: 8px;
		font-size: 12px;
		color: #64748b;
	}

	.menu-item-contrib {
		margin: 0;
		font-size: 12px;
		color: #94a3b8;
		white-space: nowrap;
	}


	.bottom-bar {
		display: flex;
		gap: var(--spacing-sm);
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

	.map-plus-btn {
		position: absolute;
		right: calc(var(--spacing-md) + env(safe-area-inset-right, 0px));
		bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
		z-index: 1100;
		width: 44px;
		height: 44px;
		border: 0;
		border-radius: 12px;
		background: white;
		color: #111827;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6px 10px rgba(0, 0, 0, 0.18), 0 2px 4px rgba(0, 0, 0, 0.12);
		transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
		-webkit-tap-highlight-color: transparent;
	}

	.map-plus-btn:hover {
		transform: translateY(-3px);
		box-shadow: 0 12px 18px rgba(0, 0, 0, 0.2), 0 5px 8px rgba(0, 0, 0, 0.14);
		background: #f8fafc;
	}

	.map-plus-btn:active {
		transform: translateY(0);
	}

	.map-plus-btn:focus-visible {
		outline: 3px solid rgba(99, 102, 241, 0.6);
		outline-offset: 2px;
	}

	.directions-banner {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0px) + var(--spacing-md));
		left: 50%;
		transform: translateX(-50%);
		z-index: 1100;
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		background: white;
		padding: var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		max-width: min(400px, calc(100vw - 2 * var(--spacing-md)));
	}

	.directions-banner-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.directions-banner-label {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.directions-banner-stats {
		font-size: 12px;
		color: #6b7280;
	}

	.directions-banner-clear {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #f3f4f6;
		color: #374151;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.directions-banner-clear:active {
		background: #e5e7eb;
	}

	.auth-btn {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0px) + var(--spacing-md));
		left: calc(env(safe-area-inset-left, 0px) + var(--spacing-md));
		z-index: 1100;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: white;
		color: #374151;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		-webkit-tap-highlight-color: transparent;
	}

	.auth-btn:active {
		transform: scale(0.95);
	}

	.auth-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--color-highlight);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		font-weight: 700;
	}
</style>
