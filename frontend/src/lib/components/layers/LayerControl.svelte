<script lang="ts">
	import { onMount } from 'svelte';
	import { layerStore } from '$stores/layers';
	import { CATEGORY_COLORS, CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category } from '$types';

	let expanded = false;
	let panel: HTMLDivElement | null = null;
	let toggleButton: HTMLButtonElement | null = null;

	const categories: { key: Category; label: string; color: string }[] = [
		{ key: 'history', label: CATEGORY_LABELS.history, color: CATEGORY_COLORS.history },
		{ key: 'architecture', label: CATEGORY_LABELS.architecture, color: CATEGORY_COLORS.architecture },
		{ key: 'food', label: CATEGORY_LABELS.food, color: CATEGORY_COLORS.food },
		{ key: 'pub', label: CATEGORY_LABELS.pub, color: CATEGORY_COLORS.pub }
	];

	onMount(() => {
		layerStore.setViewMode('sites');
	});

	function toggleExpand() {
		expanded = !expanded;
		if (expanded) {
			layerStore.setViewMode('sites');
		}
	}

	function handleWindowClick(event: MouseEvent) {
		if (!expanded) return;
		const target = event.target as Node | null;
		if (!target) return;
		if (panel?.contains(target)) return;
		if (toggleButton?.contains(target)) return;
		expanded = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			expanded = false;
		}
	}
</script>

<svelte:window on:click={handleWindowClick} on:keydown={handleKeydown} />

<div class="layer-toggle">
	<button
		class="toggle-btn ui-btn ui-btn-secondary ui-btn-sm ui-btn-control"
		bind:this={toggleButton}
		onclick={toggleExpand}
		aria-label="Toggle map"
		aria-expanded={expanded}
	>
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M12 2L2 7l10 5 10-5-10-5z"/>
			<path d="M2 17l10 5 10-5"/>
			<path d="M2 12l10 5 10-5"/>
		</svg>
		<span>Toggle map</span>
	</button>
	{#if expanded}
		<div class="layer-panel ui-panel" bind:this={panel} role="menu" aria-label="Site categories">
			<div class="panel-header ui-panel-header">
				<span class="panel-title ui-panel-title">Sites</span>
			</div>
			<div class="layer-list">
				<div class="section">
					{#each categories as cat}
						<label class="layer-item ui-item">
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
			</div>
		</div>
	{/if}
</div>

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
		height: var(--control-height);
		padding: 0 12px;
		border-radius: var(--radius-md);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		box-shadow: var(--shadow-md);
		transition: transform 0.15s ease-out;
		-webkit-tap-highlight-color: transparent;
	}

	.toggle-btn:active {
		transform: scale(0.92);
	}

	.layer-panel {
		position: absolute;
		right: 0;
		top: calc(100% + var(--spacing-xs));
		background: white;
		border-radius: var(--radius-lg);
		width: 280px;
		max-height: 70vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		z-index: 2000;
	}

	.panel-close {
		width: 40px;
		height: 40px;
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
