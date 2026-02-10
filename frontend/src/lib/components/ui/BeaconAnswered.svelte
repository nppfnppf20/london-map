<script lang="ts">
	import { beaconStore } from '$stores/beacon';
	import { placesStore } from '$stores/places';
	import { CATEGORY_LABELS, CATEGORY_COLORS } from '$utils/map-helpers';

	const beacon = $derived($beaconStore.beacon);
	const categoryNames = $derived(
		beacon?.categories?.map(c => CATEGORY_LABELS[c] || c).join(', ') || 'spots'
	);
	const beaconPlaces = $derived(
		$placesStore.places.filter(p => $beaconStore.placeIds.includes(p.id))
	);
</script>

{#if $beaconStore.active && beacon}
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
