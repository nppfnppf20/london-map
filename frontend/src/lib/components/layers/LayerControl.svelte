<script lang="ts">
	import { layerStore } from '$stores/layers';
	import { routesStore } from '$stores/routes';
	import { CATEGORY_COLORS, CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category } from '$types';

	let expanded = false;

	const categories: { key: Category; label: string; color: string }[] = [
		{ key: 'history', label: CATEGORY_LABELS.history, color: CATEGORY_COLORS.history },
		{ key: 'architecture', label: CATEGORY_LABELS.architecture, color: CATEGORY_COLORS.architecture },
		{ key: 'food', label: CATEGORY_LABELS.food, color: CATEGORY_COLORS.food },
		{ key: 'pub', label: CATEGORY_LABELS.pub, color: CATEGORY_COLORS.pub }
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
			<div class="section">
				<span class="section-title disabled">Collections</span>
			</div>

			<div class="section">
				<span class="section-title">Sites</span>
				{#each categories as cat}
					<label class="layer-item">
						<input
							type="checkbox"
							checked={$layerStore.sites[cat.key]}
							onchange={() => layerStore.toggleSite(cat.key)}
						/>
						<span class="color-dot" style="background-color: {cat.color}"></span>
						<span class="label">{cat.label}</span>
					</label>
				{/each}
			</div>

			<div class="section">
				<span class="section-title">Routes</span>
				{#each Object.entries($routesStore) as [name, color]}
					<label class="layer-item">
						<input
							type="checkbox"
							checked={$layerStore.routes[name]}
							onchange={() => layerStore.toggleRoute(name)}
						/>
						<span class="color-dot" style="background-color: {color}"></span>
						<span class="label">{name}</span>
					</label>
				{/each}
			</div>
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
		min-width: 210px;
		max-height: 70vh;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.section {
		padding: var(--spacing-xs) 0;
	}

	.section + .section {
		border-top: 1px solid #e5e7eb;
		margin-top: var(--spacing-xs);
		padding-top: var(--spacing-sm);
	}

	.section-title {
		display: block;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		padding: var(--spacing-xs) var(--spacing-sm);
	}

	.section-title.disabled {
		color: #d1d5db;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) var(--spacing-sm);
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
