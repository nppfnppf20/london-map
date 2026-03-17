<script lang="ts">
	import { layerStore } from '$stores/layers';
	import { routesStore } from '$stores/routes';
	import { collectionsStore } from '$stores/collections';
	import { CATEGORY_COLORS, CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category, ViewMode } from '$types';

	let expanded = false;
	const viewModes: { key: ViewMode; label: string }[] = [
		{ key: 'sites', label: 'Sites' },
		{ key: 'routes', label: 'Routes' },
		{ key: 'collections', label: 'Collections' }
	];

	const categories: { key: Category; label: string; color: string }[] = [
		{ key: 'history', label: CATEGORY_LABELS.history, color: CATEGORY_COLORS.history },
		{ key: 'architecture', label: CATEGORY_LABELS.architecture, color: CATEGORY_COLORS.architecture },
		{ key: 'food', label: CATEGORY_LABELS.food, color: CATEGORY_COLORS.food },
		{ key: 'pub', label: CATEGORY_LABELS.pub, color: CATEGORY_COLORS.pub }
	];

	function toggleExpand() {
		expanded = !expanded;
		if (expanded) {
			collectionsStore.fetchAll();
		}
	}
</script>

<div class="layer-control" class:expanded>
	<button class="toggle-btn" onclick={toggleExpand} aria-label="Toggle layer controls">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M12 2L2 7l10 5 10-5-10-5z"/>
			<path d="M2 17l10 5 10-5"/>
			<path d="M2 12l10 5 10-5"/>
		</svg>
		<span>Layers</span>
	</button>

	{#if expanded}
		<div class="layer-list">
			<div class="section">
				<span class="section-title">View by</span>
				<div class="view-mode">
					{#each viewModes as mode}
						<button
							type="button"
							class="mode-btn"
							class:active={$layerStore.viewMode === mode.key}
							onclick={() => layerStore.setViewMode(mode.key)}
						>
							{mode.label}
						</button>
					{/each}
				</div>
			</div>

			{#if $layerStore.viewMode === 'collections'}
				<div class="section">
					<span class="section-title">Collections</span>
					{#if $collectionsStore.loading}
						<p class="empty-note">Loading collections...</p>
					{:else if $collectionsStore.collections.length === 0}
						<p class="empty-note">No collections yet.</p>
					{:else}
						{#each $collectionsStore.collections as collection}
							<label class="layer-item">
								<input
									type="checkbox"
									checked={$layerStore.collections[collection.id]}
									onchange={() => layerStore.toggleCollection(collection.id)}
								/>
								<span
									class="color-dot"
									style="background-color: {collection.color || '#94a3b8'}"
								></span>
								<span class="label">{collection.name}</span>
							</label>
						{/each}
					{/if}
				</div>
			{:else if $layerStore.viewMode === 'sites'}
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
			{:else}
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
			{/if}
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
		padding: 8px 14px;
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		box-shadow: var(--shadow-md);
		transition: transform 0.12s ease-out;
		-webkit-tap-highlight-color: transparent;
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: 600;
	}

	.toggle-btn:active {
		transform: scale(0.93);
	}

	.layer-list {
		background: var(--surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
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
		border-top: 1px solid var(--border);
		margin-top: var(--spacing-xs);
		padding-top: var(--spacing-sm);
	}

	.section-title {
		display: block;
		font-family: var(--font-ui);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		padding: var(--spacing-xs) var(--spacing-sm);
	}

	.section-title.disabled {
		color: var(--border-strong);
	}

	.view-mode {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 4px;
		padding: 0 var(--spacing-xs) var(--spacing-xs);
	}

	.mode-btn {
		border: 1px solid var(--border);
		background: var(--surface-raised);
		color: var(--text-secondary);
		border-radius: var(--radius-sm);
		padding: 6px 4px;
		font-family: var(--font-ui);
		font-size: 12px;
		font-weight: 600;
		transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
		cursor: pointer;
	}

	.mode-btn.active {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}

	.mode-btn:active {
		opacity: 0.85;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm);
		border-radius: var(--radius-sm);
		cursor: pointer;
		color: var(--text);
		-webkit-tap-highlight-color: transparent;
		transition: background 0.1s ease;
	}

	.layer-item:active {
		background: var(--surface-subtle);
	}

	@media (hover: hover) {
		.layer-item:hover {
			background: var(--surface-raised);
		}
	}

	.color-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.label {
		font-family: var(--font-ui);
		font-size: 14px;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.empty-note {
		margin: 0;
		padding: 0 var(--spacing-sm) var(--spacing-xs);
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--text-muted);
	}

	input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
		accent-color: var(--accent);
	}
</style>
