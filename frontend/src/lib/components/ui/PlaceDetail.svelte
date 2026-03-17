<script lang="ts">
	import type { Place } from '$types';
	import { getCategoryColor, CATEGORY_LABELS } from '$utils/map-helpers';

interface Props {
	place: Place | null;
	onClose: () => void;
	onAddTo: () => void;
}

let { place, onClose, onAddTo }: Props = $props();

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
				<button class="add-to-btn" onclick={onAddTo}>Add to…</button>
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
		background: rgba(28, 25, 23, 0.5);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
	}

	.detail-panel {
		background: var(--surface);
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		border-radius: var(--radius-xl);
		display: flex;
		flex-direction: column;
		color: var(--text);
		box-shadow: var(--shadow-xl);
		border: 1px solid var(--border);
		overflow: hidden;
	}

	.header {
		position: relative;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--border);
	}

	.title-row {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.category-badge {
		font-family: var(--font-ui);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: white;
		padding: 3px 8px;
		border-radius: 999px;
	}

	.priority-badge {
		font-family: var(--font-ui);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		padding: 3px 8px;
		border-radius: 999px;
	}

	.priority-badge.site {
		background: var(--accent-subtle);
		color: var(--accent);
	}

	.priority-badge.route {
		background: var(--surface-subtle);
		color: var(--text-muted);
	}

	h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 22px;
		font-weight: 700;
		line-height: 1.25;
		letter-spacing: -0.01em;
		color: var(--text);
		padding-right: 44px;
	}

	.route-name {
		margin: var(--spacing-xs) 0 0 0;
		font-size: 13px;
		color: var(--text-muted);
	}

	.add-to-btn {
		margin-top: var(--spacing-md);
		padding: 8px 14px;
		border-radius: var(--radius-md);
		background: var(--text);
		color: var(--surface);
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: 600;
		width: fit-content;
		-webkit-tap-highlight-color: transparent;
		transition: opacity 0.12s ease;
	}

	.add-to-btn:active {
		opacity: 0.8;
	}

	.close-btn {
		position: absolute;
		top: var(--spacing-md);
		right: var(--spacing-md);
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
		transition: background 0.12s ease;
	}

	.close-btn:active {
		background: var(--border);
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
		line-height: 1.65;
		color: var(--text-secondary);
	}

	.description p:last-child {
		margin-bottom: 0;
	}

	.no-description {
		color: var(--text-muted);
		font-style: italic;
		font-size: 14px;
	}

	.tags {
		padding: var(--spacing-md) var(--spacing-lg);
		border-top: 1px solid var(--border);
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.tag {
		font-family: var(--font-ui);
		font-size: 12px;
		font-weight: 500;
		background: var(--surface-subtle);
		color: var(--text-muted);
		padding: 4px 10px;
		border-radius: 999px;
		border: 1px solid var(--border);
	}
</style>
