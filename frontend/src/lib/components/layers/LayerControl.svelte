<script lang="ts">
	import { layerStore } from '$stores/layers';
	import { CATEGORY_COLORS, CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category, LayerState } from '$types';

	let expanded = false;

	const layers: { key: keyof LayerState; label: string; color: string }[] = [
		{ key: 'history', label: CATEGORY_LABELS.history, color: CATEGORY_COLORS.history },
		{ key: 'architecture', label: CATEGORY_LABELS.architecture, color: CATEGORY_COLORS.architecture },
		{ key: 'food', label: CATEGORY_LABELS.food, color: CATEGORY_COLORS.food },
		{ key: 'pub', label: CATEGORY_LABELS.pub, color: CATEGORY_COLORS.pub },
		{ key: 'tours', label: 'Tours', color: '#22c55e' }
	];

	function toggleExpand() {
		expanded = !expanded;
	}
</script>

<div class="layer-control" class:expanded>
	<button class="toggle-btn" onclick={toggleExpand} aria-label="Toggle layer controls">
		<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M12 2L2 7l10 5 10-5-10-5z"/>
			<path d="M2 17l10 5 10-5"/>
			<path d="M2 12l10 5 10-5"/>
		</svg>
	</button>

	{#if expanded}
		<div class="layer-list">
			{#each layers as layer}
				<label class="layer-item">
					<input
						type="checkbox"
						checked={$layerStore[layer.key]}
						onchange={() => layerStore.toggle(layer.key)}
					/>
					<span class="color-dot" style="background-color: {layer.color}"></span>
					<span class="label">{layer.label}</span>
				</label>
			{/each}
		</div>
	{/if}
</div>

<style>
	.layer-control {
		position: absolute;
		top: calc(var(--spacing-md) + env(safe-area-inset-top, 0px));
		right: calc(var(--spacing-md) + env(safe-area-inset-right, 0px));
		z-index: 1000;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: var(--spacing-sm);
		-webkit-user-select: none;
		user-select: none;
	}

	.toggle-btn {
		width: 44px;
		height: 44px;
		border-radius: var(--radius-md);
		background: white;
		color: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-md);
		transition: transform 0.15s ease-out;
		-webkit-tap-highlight-color: transparent;
	}

	.toggle-btn:active {
		transform: scale(0.92);
	}

	.layer-list {
		background: white;
		border-radius: var(--radius-md);
		padding: var(--spacing-sm);
		box-shadow: var(--shadow-lg);
		min-width: 160px;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-sm);
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--color-primary);
		-webkit-tap-highlight-color: transparent;
	}

	.layer-item:active {
		background: #e5e7eb;
	}

	@media (hover: hover) {
		.layer-item:hover {
			background: #f3f4f6;
		}
	}

	.color-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.label {
		font-size: 14px;
		font-weight: 500;
	}

	input[type="checkbox"] {
		width: 20px;
		height: 20px;
		cursor: pointer;
		accent-color: var(--color-highlight);
	}
</style>
