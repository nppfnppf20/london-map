<script lang="ts">
	import { layerStore } from '$stores/layers';
	import { routesStore } from '$stores/routes';
	import { collectionsStore } from '$stores/collections';
	import { CATEGORY_COLORS, CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category, ViewMode } from '$types';

	let expanded = false;
	const viewModes: { key: ViewMode; label: string }[] = [
		{ key: 'sites', label: 'Sites' },
		{ key: 'routes', label: 'Tours' },
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

<div class="layer-toggle">
	<button class="toggle-btn" onclick={toggleExpand} aria-label="Toggle layer controls">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M12 2L2 7l10 5 10-5-10-5z"/>
			<path d="M2 17l10 5 10-5"/>
			<path d="M2 12l10 5 10-5"/>
		</svg>
		<span>Layers</span>
	</button>
</div>

{#if expanded}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="layer-backdrop" onclick={toggleExpand}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="layer-panel" onclick={(e) => e.stopPropagation()}>
			<div class="panel-header">
				<span class="panel-title">Layers</span>
				<button class="panel-close" onclick={toggleExpand} aria-label="Close">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>
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
						<span class="section-title">Tours</span>
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
		</div>
	</div>
{/if}

<style>
	.layer-toggle {
		position: absolute;
		top: calc(var(--spacing-md) + env(safe-area-inset-top, 0px));
		right: calc(var(--spacing-md) + env(safe-area-inset-right, 0px));
		z-index: 1000;
		-webkit-user-select: none;
		user-select: none;
	}

	.toggle-btn {
		padding: 8px 12px;
		border-radius: var(--radius-md);
		background: white;
		color: var(--color-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		box-shadow: var(--shadow-md);
		transition: transform 0.15s ease-out;
		-webkit-tap-highlight-color: transparent;
		font-size: 13px;
		font-weight: 700;
	}

	.toggle-btn:active {
		transform: scale(0.92);
	}

	.layer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
	}

	.layer-panel {
		background: white;
		border-radius: var(--radius-lg);
		width: 100%;
		max-width: 360px;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: 1px solid #e5e7eb;
	}

	.panel-title {
		font-size: 16px;
		font-weight: 700;
		color: var(--color-primary);
	}

	.panel-close {
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

	.panel-close:active {
		background: #e5e7eb;
	}

	.layer-list {
		padding: var(--spacing-sm);
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

	.view-mode {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--spacing-xs);
		padding: 0 var(--spacing-xs) var(--spacing-xs);
	}

	.mode-btn {
		border: 1px solid #e5e7eb;
		background: #f9fafb;
		color: #374151;
		border-radius: var(--radius-sm);
		padding: 6px 8px;
		font-size: 12px;
		font-weight: 600;
		transition: background 0.15s ease-out, border-color 0.15s ease-out;
		cursor: pointer;
	}

	.mode-btn.active {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}

	.mode-btn:active {
		transform: scale(0.98);
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

	.empty-note {
		margin: 0;
		padding: 0 var(--spacing-sm) var(--spacing-xs);
		font-size: 12px;
		color: #9ca3af;
	}

	input[type="checkbox"] {
		width: 20px;
		height: 20px;
		cursor: pointer;
		accent-color: var(--color-highlight);
	}
</style>
