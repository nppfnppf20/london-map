<script lang="ts">
	import { beaconStore } from '$stores/beacon';
	import { beaconSessionStore } from '$stores/beaconSession';
	import { placesStore } from '$stores/places';
	import { uploadBeaconImage } from '$services/storage';
	import { CATEGORY_LABELS, CATEGORY_COLORS } from '$utils/map-helpers';
	import BeaconCamera from './BeaconCamera.svelte';

	interface Props {
		onSelectOnMap: () => void;
	}

	let { onSelectOnMap }: Props = $props();

	let joinName = $state('');
	let joinStep = $state<'name' | 'groupSize' | 'camera'>('name');
	let groupSize = $state(2);
	let pendingCoords = $state<{ lat: number; lng: number } | null>(null);
	let uploading = $state(false);
	let uploadError = $state('');

	// When coords arrive from "select on map" flow, transition to photo step
	$effect(() => {
		const storeCoords = $beaconStore.pendingJoinCoords;
		if (storeCoords && joinStep === 'name') {
			pendingCoords = storeCoords;
			joinStep = 'groupSize';
		}
	});

	const beacon = $derived($beaconStore.beacon);
	const categoryNames = $derived(
		beacon?.categories?.map(c => CATEGORY_LABELS[c] || c).join(', ') || 'spots'
	);
	const beaconPlaces = $derived(
		$placesStore.places.filter(p => $beaconStore.placeIds.includes(p.id))
	);
	const strategies = $derived($beaconStore.strategies);
	const activeStrategy = $derived($beaconStore.activeStrategy);
	const currentStrategy = $derived(strategies ? strategies[activeStrategy] : null);
	const travelTimes = $derived(currentStrategy?.travelTimes ?? []);
	const strategiesDiffer = $derived(
		strategies
			? strategies.lowestTotal.midpoint.lat !== strategies.fairest.midpoint.lat
			  || strategies.lowestTotal.midpoint.lng !== strategies.fairest.midpoint.lng
			: false
	);

	function handleLocationObtained(lat: number, lng: number) {
		pendingCoords = { lat, lng };
		joinStep = 'groupSize';
	}

	function useCurrentLocation() {
		if (!joinName.trim()) return;
		beaconStore.setResponderName(joinName.trim());
		if (!navigator.geolocation) {
			onSelectOnMap();
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				handleLocationObtained(pos.coords.latitude, pos.coords.longitude);
			},
			() => {
				onSelectOnMap();
			},
			{ enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
		);
	}

	function selectOnMap() {
		if (!joinName.trim()) return;
		beaconStore.setResponderName(joinName.trim());
		onSelectOnMap();
	}

	async function finishJoin(imagePath?: string) {
		if (!pendingCoords) return;
		const token = $beaconStore.token;
		const success = await beaconStore.join(joinName.trim(), pendingCoords.lat, pendingCoords.lng, imagePath);
		if (success && token) {
			beaconSessionStore.addSession(token, 'joiner', joinName.trim());
		}
	}

	async function handleCapture(blob: Blob) {
		uploading = true;
		uploadError = '';

		try {
			const imagePath = await uploadBeaconImage(blob);
			uploading = false;
			finishJoin(imagePath);
		} catch (e) {
			uploadError = e instanceof Error ? e.message : 'Failed to upload photo';
			uploading = false;
		}
	}

	function handleSkipPhoto() {
		finishJoin();
	}

	function resetJoinStep() {
		joinStep = 'name';
		pendingCoords = null;
		groupSize = 2;
		uploading = false;
		uploadError = '';
	}
</script>

{#if $beaconStore.joining && beacon}
	<div class="beacon-join-panel" class:beacon-camera-active={joinStep !== 'name'}>
		{#if beacon.image_path}
			<img
				src={beacon.image_path}
				alt="Beacon group photo by {beacon.creator_name}"
				class="beacon-photo"
			/>
		{/if}
		<h3 class="beacon-join-title">{beacon.creator_name} has lit their beacon!</h3>
		<p class="beacon-join-subtitle">
			{#if joinStep === 'name'}Share your location to find a meeting spot
			{:else if joinStep === 'groupSize'}How many of you?
			{:else}Strike a pose!
			{/if}
		</p>

		{#if joinStep === 'name'}
			<div class="field">
				<label for="beacon-join-name">Your name</label>
				<input
					id="beacon-join-name"
					type="text"
					bind:value={joinName}
					placeholder="Enter your name"
				/>
			</div>
			<div class="beacon-join-actions">
				<button
					class="btn-primary"
					disabled={$beaconStore.loading || !joinName.trim()}
					onclick={useCurrentLocation}
				>
					{$beaconStore.loading ? 'Joining...' : 'Use current location'}
				</button>
				<button
					class="btn-cancel"
					disabled={$beaconStore.loading}
					onclick={selectOnMap}
				>
					Select on map
				</button>
			</div>

		{:else if joinStep === 'groupSize'}
			<div class="group-size-grid">
				{#each [1, 2, 3, 4] as size}
					<button
						class="group-size-btn"
						class:active={groupSize === size}
						onclick={() => { groupSize = size; }}
					>
						{size}
					</button>
				{/each}
			</div>
			<div class="beacon-join-actions">
				<button class="btn-primary" onclick={() => { joinStep = 'camera'; }}>
					Open Camera
				</button>
				<button class="btn-cancel" onclick={handleSkipPhoto}>
					Skip Photo
				</button>
			</div>
			<button class="beacon-join-dismiss" onclick={resetJoinStep}>Back</button>

		{:else if joinStep === 'camera'}
			<BeaconCamera
				{groupSize}
				onCapture={handleCapture}
				onSkip={handleSkipPhoto}
			/>
			{#if uploading}
				<p class="info-msg" style="text-align: center; font-size: 14px;">Uploading...</p>
			{/if}
			{#if uploadError}
				<p class="error-msg">{uploadError}</p>
			{/if}
		{/if}

		{#if $beaconStore.error}
			<p class="error-msg">{$beaconStore.error}</p>
		{/if}
		{#if joinStep === 'name'}
			<button class="beacon-join-dismiss" onclick={() => beaconStore.clear()}>Cancel</button>
		{/if}
	</div>

{:else if $beaconStore.active && beacon}
	<div class="beacon-answered">
		<div class="beacon-answered-header">
			<h3 class="beacon-answered-title">{beacon.creator_name}'s Beacon is lit</h3>
			<button class="beacon-banner-clear" onclick={() => { beaconStore.clear(); placesStore.fetchAll(); }}>
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12"/>
				</svg>
			</button>
		</div>
		<p class="beacon-answered-category">{beacon.creator_name} is looking for {categoryNames}</p>
		{#if travelTimes.length > 0}
			{#if strategiesDiffer}
				<div class="beacon-strategy-toggle">
					<button
						class="strategy-btn"
						class:active={activeStrategy === 'fairest'}
						onclick={() => beaconStore.setStrategy('fairest')}
					>Fairest</button>
					<button
						class="strategy-btn"
						class:active={activeStrategy === 'lowestTotal'}
						onclick={() => beaconStore.setStrategy('lowestTotal')}
					>Quickest total</button>
				</div>
			{/if}
			<div class="beacon-travel-times">
				{#each travelTimes as tt}
					<p class="beacon-travel-time">
						{tt.name} — {tt.durationMinutes >= 0 ? `${tt.durationMinutes} min by transit` : 'transit time unavailable'}
					</p>
				{/each}
			</div>
		{/if}
		<p class="beacon-answered-results">{categoryNames} near your middle point</p>
	</div>
	<div class="menu-divider ui-divider" aria-hidden="true"></div>
	<div class="menu-list ui-list">
		{#each beaconPlaces as place}
			<div class="menu-item-card ui-card">
				<div class="menu-item-main">
					<p class="menu-item-name">
						<span class="menu-item-dot ui-dot" style={`background:${CATEGORY_COLORS[place.category]}`}></span>
						{place.name}
					</p>
					<p class="menu-item-meta ui-meta">
						<span>{CATEGORY_LABELS[place.category]}</span>
					</p>
				</div>
			</div>
		{/each}
	</div>
{/if}

<style>
	.beacon-photo {
		width: 100%;
		max-width: 320px;
		border-radius: 12px;
		margin: 0 auto 12px;
		display: block;
		object-fit: cover;
	}

	.group-size-grid {
		display: flex;
		gap: 12px;
		justify-content: center;
		margin-bottom: 16px;
	}

	.group-size-btn {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		border: 2px solid var(--color-border, #ddd);
		background: var(--color-bg-secondary, #f5f5f5);
		font-size: 20px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.group-size-btn.active {
		border-color: var(--color-primary, #DAA520);
		background: var(--color-primary, #DAA520);
		color: #fff;
	}

	.beacon-camera-active {
		position: relative;
		z-index: 1200;
	}
</style>
