<script lang="ts">
	import type { Place, TravelProfile } from '$types';
	import { getCategoryColor, CATEGORY_LABELS } from '$utils/map-helpers';
	import { directionsStore, formatDuration, formatDistance, getGoogleMapsUrl } from '$stores/directions';
	import PlaceImageGallery from '$components/ui/PlaceImageGallery.svelte';

interface Props {
	place: Place | null;
	onClose: () => void;
	onAddTo: () => void;
}

let { place, onClose, onAddTo }: Props = $props();
let gettingLocation = $state(false);
let locationError = $state<string | null>(null);

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	async function handleGetDirections() {
		if (!place) return;

		gettingLocation = true;
		locationError = null;

		if (!navigator.geolocation) {
			locationError = 'Geolocation not supported';
			gettingLocation = false;
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const origin = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
					name: 'Your location'
				};
				const destination = {
					lat: place!.latitude,
					lng: place!.longitude,
					name: place!.name
				};

				const success = await directionsStore.getDirections(origin, destination);
				gettingLocation = false;

				if (!success) {
					locationError = 'Failed to get directions';
				}
			},
			(error) => {
				gettingLocation = false;
				switch (error.code) {
					case error.PERMISSION_DENIED:
						locationError = 'Location permission denied';
						break;
					case error.POSITION_UNAVAILABLE:
						locationError = 'Location unavailable';
						break;
					case error.TIMEOUT:
						locationError = 'Location request timed out';
						break;
					default:
						locationError = 'Failed to get location';
				}
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}

	function handleOpenGoogleMaps() {
		if (!place || !$directionsStore.origin) return;

		const url = getGoogleMapsUrl(
			$directionsStore.origin,
			{ lat: place.latitude, lng: place.longitude },
			'walking'
		);
		window.open(url, '_blank');
	}

	function handleClearDirections() {
		directionsStore.clear();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if place}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={handleBackdropClick}>
		<div class="detail-panel">
			<div class="header">
				<div class="title-row">
					<span
						class="category-badge"
						style="background-color: {getCategoryColor(place.category)}"
					>
						{CATEGORY_LABELS[place.category] || place.category}
					</span>
					{#if place.priority === 'site'}
						<span class="priority-badge site">Site</span>
					{:else}
						<span class="priority-badge route">Route</span>
					{/if}
				</div>
				<h2>{place.name}</h2>
				{#if place.route || place.route_stop}
					<p class="route-name">
						{#if place.route}{place.route}{/if}
						{#if place.route_stop} · Stop {place.route_stop}{/if}
					</p>
				{/if}
				<div class="action-buttons">
					{#if !$directionsStore.active || $directionsStore.destination?.lat !== place.latitude}
						<button
							class="directions-btn"
							onclick={handleGetDirections}
							disabled={gettingLocation || $directionsStore.loading}
						>
							{#if gettingLocation || $directionsStore.loading}
								Getting directions…
							{:else}
								Get Directions
							{/if}
						</button>
					{:else}
						<button class="directions-btn clear" onclick={handleClearDirections}>
							Clear Route
						</button>
					{/if}
				</div>
				<div class="action-buttons secondary">
					<button class="add-to-btn" onclick={onAddTo}>Add to…</button>
					<button class="meta-btn" type="button" disabled>Like</button>
					<button class="meta-btn" type="button" disabled>Comment</button>
				</div>
				{#if locationError}
					<p class="error-text">{locationError}</p>
				{/if}
				{#if $directionsStore.active && $directionsStore.result && $directionsStore.destination?.lat === place.latitude}
					<div class="directions-info">
						<div class="directions-stats">
							<span class="stat">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"/>
									<path d="M12 6v6l4 2"/>
								</svg>
								{formatDuration($directionsStore.result.duration)}
							</span>
							<span class="stat">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
									<circle cx="12" cy="10" r="3"/>
								</svg>
								{formatDistance($directionsStore.result.distance)}
							</span>
						</div>
						<button class="google-maps-btn" onclick={handleOpenGoogleMaps}>
							Open in Google Maps
						</button>
					</div>
				{/if}
				<button class="close-btn" onclick={onClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="content">
				<PlaceImageGallery audioPath={place.audio_path} images={place.images || []} />
				{#if place.description}
					<div class="description">
						{#each place.description.split('\n\n') as paragraph}
							<p>{paragraph}</p>
						{/each}
					</div>
				{:else}
					<p class="no-description">No description available.</p>
				{/if}

				<div class="comments">
					<div class="comments-header">
						<span class="comments-title">Comments</span>
						<span class="comments-subtitle">Coming soon</span>
					</div>
					<div class="comments-placeholder">
						No comments yet.
					</div>
				</div>
			</div>

			{#if place.tags && place.tags.length > 0}
				<div class="tags">
					{#each place.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
	}

	.detail-panel {
		background: white;
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		color: var(--color-primary);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.header {
		position: relative;
		padding: var(--spacing-lg);
		border-bottom: 1px solid #e5e7eb;
	}

	.title-row {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.category-badge {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		color: white;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.priority-badge {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.priority-badge.site {
		background: var(--color-highlight);
		color: white;
	}

	.priority-badge.route {
		background: #e5e7eb;
		color: #6b7280;
	}

	h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		line-height: 1.3;
		padding-right: 40px;
	}

	.route-name {
		margin: var(--spacing-xs) 0 0 0;
		font-size: 13px;
		color: #6b7280;
	}

	.action-buttons {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
	}

	.action-buttons.secondary {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin-top: var(--spacing-sm);
	}

	.add-to-btn {
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: #111827;
		color: white;
		font-size: 12px;
		font-weight: 600;
		width: 100%;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		-webkit-tap-highlight-color: transparent;
	}

	.directions-btn {
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: #3b82f6;
		color: white;
		font-size: 12px;
		font-weight: 600;
		width: 100%;
		-webkit-tap-highlight-color: transparent;
	}

	.directions-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.directions-btn.clear {
		background: #6b7280;
	}

	.meta-btn {
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: #f3f4f6;
		color: #374151;
		font-size: 12px;
		font-weight: 600;
		width: 100%;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		-webkit-tap-highlight-color: transparent;
	}

	.meta-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-text {
		margin: var(--spacing-sm) 0 0 0;
		font-size: 12px;
		color: #ef4444;
	}

	.directions-info {
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		background: #f0f9ff;
		border-radius: var(--radius-md);
		border: 1px solid #bae6fd;
	}

	.directions-stats {
		display: flex;
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
	}

	.stat {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 14px;
		font-weight: 600;
		color: #0369a1;
	}

	.stat svg {
		color: #0ea5e9;
	}

	.google-maps-btn {
		margin-top: var(--spacing-sm);
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		background: white;
		color: #0369a1;
		font-size: 12px;
		font-weight: 600;
		border: 1px solid #7dd3fc;
		-webkit-tap-highlight-color: transparent;
	}

	.google-maps-btn:active {
		background: #e0f2fe;
	}

	.close-btn {
		position: absolute;
		top: var(--spacing-md);
		right: var(--spacing-md);
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #f3f4f6;
		color: #374151;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.close-btn:active {
		background: #e5e7eb;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		-webkit-overflow-scrolling: touch;
	}

	.description p {
		margin: 0 0 var(--spacing-md) 0;
		font-size: 15px;
		line-height: 1.6;
		color: #374151;
	}

	.description p:last-child {
		margin-bottom: 0;
	}

	.no-description {
		color: #9ca3af;
		font-style: italic;
	}

	.comments {
		margin-top: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.comments-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.comments-title {
		font-size: 14px;
		font-weight: 700;
		color: #111827;
	}

	.comments-subtitle {
		font-size: 12px;
		color: #9ca3af;
	}

	.comments-placeholder {
		padding: 10px 12px;
		border-radius: var(--radius-md);
		border: 1px solid #e5e7eb;
		background: #f9fafb;
		color: #9ca3af;
		font-size: 13px;
	}

	.tags {
		padding: var(--spacing-md) var(--spacing-lg);
		border-top: 1px solid #e5e7eb;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.tag {
		font-size: 12px;
		background: #f3f4f6;
		color: #6b7280;
		padding: 4px 10px;
		border-radius: 12px;
	}
</style>
