<script lang="ts">
	import { nearbyStore } from '$stores/nearby';

	interface Props {
		onEdit?: () => void;
	}

	let { onEdit }: Props = $props();
	let radiusMeters = $state(1000);

	$effect(() => {
		radiusMeters = $nearbyStore.radiusMeters;
	});

	function formatRadius(value: number) {
		return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${value} m`;
	}

	function handleRadiusChange(event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		if (Number.isFinite(value)) {
			nearbyStore.updateRadius(value);
		}
	}
</script>

{#if $nearbyStore.active}
	<div class="nearby-control">
		<div class="nearby-header">
			<span class="title">Nearby results</span>
			<div class="actions">
				{#if onEdit}
					<button class="ghost" onclick={onEdit}>Filters</button>
				{/if}
				<button class="ghost" onclick={() => nearbyStore.clear()}>Clear</button>
			</div>
		</div>
		<div class="radius-row">
			<input
				type="range"
				min="250"
				max="3000"
				step="250"
				value={radiusMeters}
				onchange={handleRadiusChange}
			/>
			<span class="radius-value">{formatRadius($nearbyStore.radiusMeters)}</span>
		</div>
		<div class="meta">
			{#if $nearbyStore.loading}
				<span>Updating...</span>
			{:else}
				<span>{$nearbyStore.placeIds.length} places</span>
			{/if}
		</div>
	</div>
{/if}

<style>
	.nearby-control {
		position: absolute;
		left: var(--spacing-md);
		right: var(--spacing-md);
		bottom: calc(var(--bottom-bar-height, 0px) + env(safe-area-inset-bottom, 0px) + var(--spacing-md));
		z-index: 1150;
		background: var(--surface);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
		padding: var(--spacing-sm) var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.nearby-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.title {
		font-family: var(--font-ui);
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.actions {
		display: flex;
		gap: var(--spacing-xs);
	}

	.ghost {
		border-radius: 999px;
		padding: 4px 12px;
		font-family: var(--font-ui);
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		-webkit-tap-highlight-color: transparent;
		transition: background 0.12s ease;
	}

	.ghost:active {
		background: var(--border);
	}

	.radius-row {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.radius-row input[type="range"] {
		flex: 1;
		accent-color: var(--accent);
	}

	.radius-value {
		min-width: 56px;
		text-align: right;
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: 600;
		color: var(--text);
	}

	.meta {
		font-size: 12px;
		color: var(--text-muted);
	}
</style>
