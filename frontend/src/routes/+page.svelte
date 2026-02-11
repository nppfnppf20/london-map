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
	import ExploreModal from '$components/ui/ExploreModal.svelte';
	import BeaconsModal from '$components/ui/BeaconsModal.svelte';
	import BeaconPanel from '$components/ui/BeaconPanel.svelte';
	import BeaconHome from '$components/ui/BeaconHome.svelte';
	import { shareLinksApi } from '$services/api';
	import { placesStore } from '$stores/places';
	import { collectionsStore } from '$stores/collections';
	import { routesStore } from '$stores/routes';
	import { mapStore } from '$stores/map';
	import { selectedPlace } from '$stores/selected';
	import { routeBuilder } from '$stores/routeBuilder';
	import { routeSearchStore } from '$stores/routeSearch';
	import { nearbyStore } from '$stores/nearby';
	import { directionsStore, formatDuration, formatDistance } from '$stores/directions';
	import { layerStore } from '$stores/layers';
	import { authStore } from '$stores/auth';
	import { shareStore } from '$stores/share';
	import { beaconStore } from '$stores/beacon';
	import { beaconSessionStore, beaconBadgeCount } from '$stores/beaconSession';
	import { CATEGORY_LABELS, CATEGORY_COLORS } from '$utils/map-helpers';
	import { goto } from '$app/navigation';

	let authModalOpen = $state(false);
	let addModalOpen = $state(false);
	let routeModalOpen = $state(false);
	let addSiteToOpen = $state(false);
	let nearbyModalOpen = $state(false);
	let routeSearchModalOpen = $state(false);
	let addMenuOpen = $state(false);
	let exploreModalOpen = $state(false);
	let plusMenuOpen = $state(false);
	let beaconsModalOpen = $state(false);
	let pinMode = $state(false);
	let pinCoords = $state<[number, number] | null>(null);
	let pinAction = $state<'add' | 'nearby' | 'beacon' | 'beaconJoin' | null>(null);
	let beaconPinCoords = $state<[number, number] | null>(null);
	let menuTab = $state<'Places' | 'Lists' | 'Tours' | 'Beacons'>('Lists');
	let filterScopes = $state<Set<'Friends' | 'Friends of Friends' | 'Public' | 'Private'>>(
		new Set(['Public'])
	);
	let shareModalOpen = $state(false);
	let shareUrl = $state('');
	let shareCopied = $state(false);

	function toggleScope(scope: 'Friends' | 'Friends of Friends' | 'Public' | 'Private') {
		const next = new Set(filterScopes);
		if (next.has(scope)) {
			next.delete(scope);
		} else {
			next.add(scope);
		}
		filterScopes = next;
	}

	const LONDON_CENTER: [number, number] = [51.5074, -0.1278];
	let userLocation = $state<[number, number]>(LONDON_CENTER);

	$effect(() => {
		placesStore.fetchAll();
		collectionsStore.fetchAll();
		beaconSessionStore.init();
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					userLocation = [pos.coords.latitude, pos.coords.longitude];
				},
				() => {},
				{ maximumAge: 60000, timeout: 5000 }
			);
		}
	});

	$effect(() => {
		if (menuTab === 'Places') {
			layerStore.showAllSites();
		} else if (menuTab === 'Lists') {
			layerStore.showAllCollections();
		} else if (menuTab === 'Tours') {
			layerStore.showAllRoutes();
		}
		// Beacons tab doesn't change map layers
	});

	$effect(() => {
		if ($beaconStore.active && $beaconStore.midpoint) {
			mapStore.flyTo($beaconStore.midpoint, 14);
		}
	});

	let nearestPlaces = $derived.by(() => {
		const places = $placesStore.places;
		if (!places.length) return [];
		return [...places]
			.map(p => ({
				...p,
				_dist: distanceMeters(userLocation, [p.latitude, p.longitude])
			}))
			.sort((a, b) => a._dist - b._dist)
			.slice(0, 10);
	});

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
		if (pinAction === 'beacon') {
			beaconPinCoords = $mapStore.center;
			beaconsModalOpen = true;
		}
		if (pinAction === 'beaconJoin') {
			const coords = $mapStore.center;
			beaconStore.setPendingJoinCoords(coords[0], coords[1]);
		}
		pinAction = null;
	}

	async function shareCollection(collectionId: string, collectionName: string) {
		try {
			const link = await shareLinksApi.create({
				name: collectionName,
				collection_ids: [collectionId]
			});
			shareUrl = `${window.location.origin}/share/${link.token}`;
			shareCopied = false;
			shareModalOpen = true;
		} catch (err) {
			// silently fail
		}
	}

	function copyShareUrl() {
		navigator.clipboard.writeText(shareUrl);
		shareCopied = true;
	}

	function closeMenus() {
		addMenuOpen = false;
		exploreModalOpen = false;
	}

	function startNearbyFlow() {
		exploreModalOpen = false;
		if (!navigator.geolocation) {
			startPinMode('nearby');
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
				pinCoords = coords;
				mapStore.flyTo(coords, 15);
				nearbyModalOpen = true;
			},
			() => {
				startPinMode('nearby');
			},
			{ enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
		);
	}

	function startAddAtCurrentLocation() {
		plusMenuOpen = false;
		addModalOpen = true;

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					pinCoords = [position.coords.latitude, position.coords.longitude];
				},
				() => {},
				{ enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
			);
		}
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

			{#if $routeSearchStore.drawing}
				<button
					class="draw-fab ui-fab"
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

		<button
			class="beacon-btn ui-fab"
			type="button"
			aria-label="The Beacons are Lit"
			onclick={() => { beaconsModalOpen = true; }}
		>
			<span style="font-size: 22px; line-height: 1;">🔥</span>
		</button>

		<div class="plus-menu-wrap">
			<button
				class="map-plus-btn ui-fab"
				type="button"
				aria-label="Add"
				aria-expanded={plusMenuOpen}
				onclick={() => { plusMenuOpen = !plusMenuOpen; }}
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 5v14" />
					<path d="M5 12h14" />
				</svg>
			</button>
			{#if plusMenuOpen}
				<div class="plus-menu">
					<button class="plus-menu-item ui-btn ui-btn-secondary" onclick={startAddAtCurrentLocation}>
						Add site at current location
					</button>
					<button
						class="plus-menu-item ui-btn ui-btn-secondary"
						onclick={() => {
							plusMenuOpen = false;
							startPinMode('add');
						}}
					>
						Select location
					</button>
				</div>
			{/if}
		</div>
	</section>

	<section class="menu-pane">
		<div class="menu-surface">
			{#if exploreModalOpen}
				<ExploreModal
					open={exploreModalOpen}
					onClose={() => exploreModalOpen = false}
					onNear={() => {
						startNearbyFlow();
					}}
					onRoute={() => {
						exploreModalOpen = false;
						nearbyStore.clear();
						routeSearchStore.startDrawing();
					}}
				/>
			{:else}
				<div class="menu-grip" aria-hidden="true"></div>
				{#if $beaconStore.active || $beaconStore.joining}
					<BeaconPanel onSelectOnMap={() => startPinMode("beaconJoin")} />
				{:else}
				{#if $shareStore.active}
					<div class="share-banner">
						<span class="share-banner-text">Shared: {$shareStore.name}</span>
						<button class="share-banner-clear" onclick={() => { shareStore.clear(); placesStore.fetchAll(); collectionsStore.fetchAll(); }}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M18 6L6 18M6 6l12 12"/>
							</svg>
						</button>
					</div>
				{/if}
					<MenuNav value={menuTab} onSelect={(tab) => { menuTab = tab; }} badge={$beaconBadgeCount} />
				<div class="menu-divider ui-divider" aria-hidden="true"></div>
				{#if menuTab === 'Beacons'}
					<BeaconHome />
				{:else}
				<div class="filter-row ui-chip-row" aria-label="Filter scope">
					<button
						type="button"
						class="filter-chip ui-chip"
						class:active={filterScopes.has('Friends')}
						onclick={() => { toggleScope('Friends'); }}
					>
						Friends
					</button>
					<button
						type="button"
						class="filter-chip ui-chip"
						class:active={filterScopes.has('Friends of Friends')}
						onclick={() => { toggleScope('Friends of Friends'); }}
					>
						Friends of Friends
					</button>
					<button
						type="button"
						class="filter-chip ui-chip"
						class:active={filterScopes.has('Public')}
						onclick={() => { toggleScope('Public'); }}
					>
						Public
					</button>
					<button
						type="button"
						class="filter-chip ui-chip"
						class:active={filterScopes.has('Private')}
						onclick={() => { toggleScope('Private'); }}
					>
						Private
					</button>
				</div>
				<div class="menu-list ui-list">
					{#if menuTab === 'Places'}
						{#if $placesStore.loading}
							<div class="menu-item-placeholder"></div>
							<div class="menu-item-placeholder"></div>
							<div class="menu-item-placeholder"></div>
						{:else if nearestPlaces.length === 0}
							<p class="menu-empty ui-meta">No places yet.</p>
						{:else}
							{#each nearestPlaces as place}
								<div class="menu-item-card ui-card">
									<div class="menu-item-main">
										<p class="menu-item-name">
											<span class="menu-item-dot ui-dot" style={`background:${CATEGORY_COLORS[place.category]}`}></span>
											{place.name}
										</p>
										<p class="menu-item-meta ui-meta">
											<span>{CATEGORY_LABELS[place.category]}</span>
											<span>&middot;</span>
											<span>{formatDistance(place._dist)}</span>
										</p>
									</div>
								</div>
							{/each}
						{/if}
					{:else if menuTab === 'Lists'}
						{#if $collectionsStore.loading}
							<div class="menu-item-placeholder"></div>
							<div class="menu-item-placeholder"></div>
							<div class="menu-item-placeholder"></div>
						{:else if $collectionsStore.collections.length === 0}
							<p class="menu-empty ui-meta">No collections yet.</p>
						{:else}
							{#each $collectionsStore.collections as collection}
								<button
									class="menu-item-card ui-card menu-item-toggle"
									class:active={$layerStore.collections[collection.id]}
									type="button"
									onclick={() => layerStore.toggleCollection(collection.id)}
								>
									<span
										class="menu-item-check"
										class:checked={$layerStore.collections[collection.id]}
										style={$layerStore.collections[collection.id] ? `background:${collection.color || '#94a3b8'}; border-color:${collection.color || '#94a3b8'}` : ''}
									></span>
									<div class="menu-item-main">
										<p class="menu-item-name">
											<span class="menu-item-dot ui-dot" style={`background:${collection.color || '#94a3b8'}`}></span>
											{collection.name}
										</p>
										{#if collection.description}
											<p class="menu-item-meta ui-meta">{collection.description}</p>
										{/if}
									</div>
									{#if $authStore.user && $authStore.user.role === 'admin'}
										<button
											class="share-icon-btn"
											type="button"
											aria-label="Share {collection.name}"
											onclick={(e) => { e.stopPropagation(); shareCollection(collection.id, collection.name); }}
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
												<path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
											</svg>
										</button>
									{/if}
								</button>
							{/each}
						{/if}
					{:else}
						{#if Object.keys($routesStore).length === 0}
							<p class="menu-empty ui-meta">No tours yet.</p>
						{:else}
							{#each Object.entries($routesStore) as [name, color]}
								<button
									class="menu-item-card ui-card menu-item-toggle"
									class:active={$layerStore.routes[name]}
									type="button"
									onclick={() => layerStore.toggleRoute(name)}
								>
									<span
										class="menu-item-check"
										class:checked={$layerStore.routes[name]}
										style={$layerStore.routes[name] ? `background:${color}; border-color:${color}` : ''}
									></span>
									<div class="menu-item-main">
										<p class="menu-item-name">
											<span class="menu-item-dot ui-dot" style={`background:${color}`}></span>
											{name}
										</p>
									</div>
								</button>
							{/each}
						{/if}
					{/if}
				</div>
				{/if}
				{/if}
			{/if}
		</div>

		{#if !$routeBuilder.active}
			<div class="bottom-bar">
				<div class="menu-stack">
					<button
						class="bar-btn ui-btn ui-btn-secondary"
						onclick={() => {
							addMenuOpen = false;
							exploreModalOpen = true;
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
					{#if $authStore.user}
						<button
							class="bar-btn ui-btn ui-btn-secondary"
							onclick={() => goto('/profile')}
							aria-label="Profile"
						>
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
								<circle cx="12" cy="7" r="4"/>
							</svg>
							Profile
						</button>
					{:else}
						<button
							class="bar-btn ui-btn ui-btn-secondary"
							onclick={() => {
								addMenuOpen = false;
								exploreModalOpen = false;
								authModalOpen = true;
							}}
							aria-label="Login"
						>
							Login
						</button>
					{/if}
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
					<button class="pin-btn ui-btn ui-btn-secondary" onclick={cancelPinMode}>Cancel</button>
					<button class="pin-btn ui-btn ui-btn-primary" onclick={confirmPinMode}>Use this spot</button>
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
						class="pin-btn ui-btn ui-btn-secondary"
						onclick={() => {
							routeSearchStore.clear();
						}}
					>
						Cancel
					</button>
					<button
						class="pin-btn ui-btn ui-btn-primary"
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
	<BeaconsModal
		open={beaconsModalOpen}
		mapCoords={beaconPinCoords}
		onClose={() => {
			beaconsModalOpen = false;
			beaconPinCoords = null;
		}}
		onSelectOnMap={() => {
			beaconsModalOpen = false;
			startPinMode('beacon');
		}}
	/>

	{#if shareModalOpen}
		<div class="share-modal-backdrop" onclick={() => shareModalOpen = false}>
			<div class="share-modal" onclick={(e) => e.stopPropagation()}>
				<h3 class="share-modal-title">Share Link</h3>
				<div class="share-modal-url">
					<input type="text" readonly value={shareUrl} class="share-modal-input" />
					<button class="share-modal-copy" onclick={copyShareUrl}>
						{shareCopied ? 'Copied!' : 'Copy'}
					</button>
				</div>
				<button class="share-modal-close" onclick={() => shareModalOpen = false}>Done</button>
			</div>
		</div>
	{/if}
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
		padding: var(--spacing-md);
		background: white;
		border-top-left-radius: 24px;
		border-top-right-radius: 24px;
		box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.12);
	}

	.menu-surface {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		min-height: 0;
	}

	.menu-grip {
		width: 54px;
		height: 6px;
		border-radius: 999px;
		background: #e5e7eb;
		align-self: center;
	}

	.menu-item-placeholder {
		height: 56px;
		border-radius: 16px;
		background: #f3f4f6;
	}

	.menu-empty {
		text-align: center;
		padding: var(--spacing-lg);
		color: #9ca3af;
	}

	.bottom-bar {
		margin-top: auto;
		display: flex;
		gap: var(--spacing-sm);
		padding-bottom: calc(var(--spacing-sm) + env(safe-area-inset-bottom, 0px));
	}

	.bottom-bar > .bar-btn {
		flex: 1;
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
		pointer-events: auto;
	}

	.draw-fab {
		position: absolute;
		right: calc(var(--spacing-md) + env(safe-area-inset-right, 0px));
		bottom: calc(var(--bottom-bar-height) + env(safe-area-inset-bottom, 0px) + 72px);
		z-index: var(--z-fab);
		background: white;
		color: var(--color-primary);
		-webkit-tap-highlight-color: transparent;
	}

	.draw-fab.active {
		background: var(--color-highlight);
		color: white;
	}

	.map-plus-btn {
		z-index: var(--z-fab);
		border: 0;
		background: #ef4444;
		color: white;
		-webkit-tap-highlight-color: transparent;
	}

	.map-plus-btn:hover {
		background: #dc2626;
	}

	.map-plus-btn:focus-visible {
		outline: 3px solid rgba(99, 102, 241, 0.6);
		outline-offset: 2px;
	}

	.beacon-btn {
		position: absolute;
		right: calc(var(--spacing-md) + env(safe-area-inset-right, 0px));
		bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px) + 56px);
		z-index: var(--z-fab);
		border: 0;
		background: var(--gray-100);
		color: white;
		-webkit-tap-highlight-color: transparent;
	}

	.beacon-btn:hover {
		background: var(--gray-200);
	}

	.plus-menu-wrap {
		position: absolute;
		right: calc(var(--spacing-md) + env(safe-area-inset-right, 0px));
		bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
		z-index: var(--z-fab);
	}

	.plus-menu {
		position: absolute;
		right: 0;
		bottom: calc(100% + 10px);
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 220px;
		background: white;
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
		box-shadow: var(--shadow-lg);
	}

	.plus-menu-item {
		width: 100%;
		text-align: left;
		font-size: 13px;
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

	.menu-item-toggle {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		text-align: left;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.menu-item-check {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 2px solid #cbd5e1;
		background: white;
		transition: background 0.15s, border-color 0.15s;
		position: relative;
	}

	.share-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: #eef2ff;
		border: 1px solid #c7d2fe;
		border-radius: var(--radius-md);
	}

	.share-banner-text {
		flex: 1;
		font-size: 13px;
		font-weight: 600;
		color: #4338ca;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.share-banner-clear {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: transparent;
		color: #6366f1;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.share-banner-clear:active {
		background: #c7d2fe;
	}

	.share-icon-btn {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: #f3f4f6;
		color: #6b7280;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.share-icon-btn:active {
		background: #e5e7eb;
	}

	.share-modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 2000;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
	}

	.share-modal {
		background: white;
		border-radius: 16px;
		padding: 24px;
		max-width: 400px;
		width: 100%;
		box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
	}

	.share-modal-title {
		margin: 0 0 16px;
		font-size: 18px;
		font-weight: 700;
		color: #0f172a;
	}

	.share-modal-url {
		display: flex;
		gap: 8px;
		margin-bottom: 16px;
	}

	.share-modal-input {
		flex: 1;
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 13px;
		color: #374151;
		background: #f9fafb;
		min-width: 0;
	}

	.share-modal-copy {
		padding: 10px 16px;
		border-radius: 8px;
		background: var(--color-highlight, #6366f1);
		color: white;
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
		-webkit-tap-highlight-color: transparent;
	}

	.share-modal-close {
		width: 100%;
		padding: 12px;
		border-radius: 8px;
		background: #f3f4f6;
		color: #374151;
		font-size: 14px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
	}

</style>
