<script lang="ts">
	import { layerStore } from '$stores/layers';
	import { routesStore } from '$stores/routes';

	let expanded = false;

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
			{#each Object.entries($routesStore) as [name, color]}
				<label class="layer-item">
					<input
						type="checkbox"
						checked={$layerStore[name]}
						onchange={() => layerStore.toggle(name)}
					/>
					<span class="color-dot" style="background-color: {color}"></span>
					<span class="label">{name}</span>
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
		min-width: 200px;
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
