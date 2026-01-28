<script lang="ts">
	import { routeBuilder } from '$stores/routeBuilder';

	let undoing = $state(false);
	let cancelling = $state(false);

	async function handleUndo() {
		undoing = true;
		await routeBuilder.undoLast();
		undoing = false;
	}

	async function handleCancel() {
		cancelling = true;
		await routeBuilder.cancel();
		cancelling = false;
	}

	function handleDone() {
		routeBuilder.finish();
	}
</script>

{#if $routeBuilder.active}
	<div class="banner" style="border-left-color: {$routeBuilder.color}">
		<div class="info">
			<span class="route-name">{$routeBuilder.routeName}</span>
			<span class="status">
				{#if $routeBuilder.stops.length === 0}
					Tap a marker to add Stop 1
				{:else}
					{$routeBuilder.stops.length} stop{$routeBuilder.stops.length === 1 ? '' : 's'} added — tap next
				{/if}
			</span>
		</div>

		<div class="actions">
			{#if $routeBuilder.stops.length > 0}
				<button class="btn-undo" onclick={handleUndo} disabled={undoing} aria-label="Undo last stop">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M3 10h13a4 4 0 0 1 0 8H7"/>
						<path d="M3 10l4-4M3 10l4 4"/>
					</svg>
				</button>
			{/if}

			<button class="btn-cancel" onclick={handleCancel} disabled={cancelling}>
				Cancel
			</button>

			<button class="btn-done" onclick={handleDone} disabled={$routeBuilder.stops.length === 0}>
				Done
			</button>
		</div>
	</div>
{/if}

<style>
	.banner {
		position: absolute;
		top: calc(var(--spacing-md) + env(safe-area-inset-top, 0px));
		left: calc(var(--spacing-md) + env(safe-area-inset-left, 0px));
		right: calc(64px + var(--spacing-md) + env(safe-area-inset-right, 0px));
		z-index: 1001;
		background: white;
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-lg);
		padding: var(--spacing-sm) var(--spacing-md);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		border-left: 4px solid #6b7280;
	}

	.info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.route-name {
		font-size: 14px;
		font-weight: 700;
		color: var(--color-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.status {
		font-size: 12px;
		color: #6b7280;
	}

	.actions {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}

	.btn-undo {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		background: #f3f4f6;
		color: #374151;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.btn-undo:active:not(:disabled) {
		background: #e5e7eb;
	}

	.btn-cancel,
	.btn-done {
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		font-size: 13px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
	}

	.btn-cancel {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-cancel:active:not(:disabled) {
		background: #e5e7eb;
	}

	.btn-done {
		background: var(--color-highlight);
		color: white;
	}

	.btn-done:active:not(:disabled) {
		opacity: 0.85;
	}

	.btn-done:disabled,
	.btn-cancel:disabled,
	.btn-undo:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
