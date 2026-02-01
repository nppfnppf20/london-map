<script lang="ts">
	import { routeSearchStore } from '$stores/routeSearch';
	import { nearbyStore } from '$stores/nearby';

	interface Props {
		onEdit?: () => void;
		onRedraw?: () => void;
	}

	let { onEdit, onRedraw }: Props = $props();

	function formatWidth(value: number) {
		return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${value} m`;
	}

	function handleWidthChange(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		if (Number.isFinite(value)) {
			routeSearchStore.updateWidth(value);
		}
	}
</script>

{#if $routeSearchStore.active && !$nearbyStore.active}
	<div class="route-control">
		<div class="route-header">
			<span class="title">Along route</span>
			<div class="actions">
				{#if onEdit}
					<button class="ghost" onclick={onEdit}>Filters</button>
				{/if}
				{#if onRedraw}
					<button class="ghost" onclick={onRedraw}>Redraw</button>
				{/if}
				<button class="ghost" onclick={() => routeSearchStore.clear()}>Clear</button>
			</div>
		</div>
		<div class="width-row">
			<input
				type="range"
				min="50"
				max="1000"
				step="25"
				value={$routeSearchStore.widthMeters}
				onchange={handleWidthChange}
			/>
			<span class="width-value">{formatWidth($routeSearchStore.widthMeters)}</span>
		</div>
		<div class="meta">
			{#if $routeSearchStore.loading}
				<span>Updating...</span>
			{:else}
				<span>{$routeSearchStore.placeIds.length} places</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.route-control {
		position: absolute;
		left: var(--spacing-md);
		right: var(--spacing-md);
		bottom: calc(var(--bottom-bar-height, 0px) + env(safe-area-inset-bottom, 0px) + var(--spacing-md));
		z-index: 1150;
		background: white;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		padding: var(--spacing-sm) var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.route-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.title {
		font-size: 13px;
		font-weight: 700;
		color: var(--color-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.actions {
		display: flex;
		gap: var(--spacing-xs);
		flex-wrap: wrap;
		justify-content: flex-end;
	}

	.ghost {
		border-radius: 999px;
		padding: 4px 10px;
		font-size: 12px;
		font-weight: 600;
		color: var(--color-primary);
		background: #f3f4f6;
		-webkit-tap-highlight-color: transparent;
	}

	.ghost:active {
		background: #e5e7eb;
	}

	.width-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.width-row input[type="range"] {
		flex: 1;
		accent-color: var(--color-highlight);
	}

	.width-value {
		min-width: 64px;
		text-align: right;
		font-size: 13px;
		font-weight: 600;
		color: #374151;
	}

	.meta {
		font-size: 12px;
		color: #6b7280;
	}
</style>
