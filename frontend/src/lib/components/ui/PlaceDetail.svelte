<script lang="ts">
	import type { Place } from '$types';
	import { getCategoryColor, CATEGORY_LABELS } from '$utils/map-helpers';

	interface Props {
		place: Place | null;
		onClose: () => void;
	}

	let { place, onClose }: Props = $props();

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
				<button class="close-btn" onclick={onClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="content">
				{#if place.description}
					<div class="description">
						{#each place.description.split('\n\n') as paragraph}
							<p>{paragraph}</p>
						{/each}
					</div>
				{:else}
					<p class="no-description">No description available.</p>
				{/if}
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
