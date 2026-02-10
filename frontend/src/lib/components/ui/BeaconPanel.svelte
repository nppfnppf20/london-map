<script lang="ts">
	import { beaconStore } from '$stores/beacon';
	import { placesStore } from '$stores/places';
	import { CATEGORY_LABELS, CATEGORY_COLORS } from '$utils/map-helpers';

	interface Props {
		onSelectOnMap: () => void;
	}

	let { onSelectOnMap }: Props = $props();

	let joinName = $state('');

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

	function useCurrentLocation() {
		if (!joinName.trim()) return;
		beaconStore.setResponderName(joinName.trim());
		if (!navigator.geolocation) {
			onSelectOnMap();
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				beaconStore.join(joinName.trim(), pos.coords.latitude, pos.coords.longitude);
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
</script>

{#if $beaconStore.joining && beacon}
	<div class="beacon-join-panel">
		<h3 class="beacon-join-title">{beacon.creator_name} has lit their beacon!</h3>
		<p class="beacon-join-subtitle">Share your location to find a meeting spot</p>
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
		{#if $beaconStore.error}
			<p class="error-msg">{$beaconStore.error}</p>
		{/if}
		<button class="beacon-join-dismiss" onclick={() => beaconStore.clear()}>Cancel</button>
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
