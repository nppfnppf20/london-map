<script lang="ts">
	import { routeBuilder } from '$stores/routeBuilder';
	import { routesStore } from '$stores/routes';
	import { layerStore } from '$stores/layers';
	import { COLOR_SWATCHES } from '$utils/map-helpers';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let name = $state('');
	let selectedColor = $state(COLOR_SWATCHES[0].value);
	let error = $state('');

	function reset() {
		name = '';
		selectedColor = COLOR_SWATCHES[0].value;
		error = '';
	}

	function handleClose() {
		reset();
		onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			handleClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClose();
		}
	}

	function handleStart() {
		const trimmed = name.trim();
		if (!trimmed) {
			error = 'Route name is required';
			return;
		}

		// Register the new route colour
		routesStore.add(trimmed, selectedColor);

		// Enter plotting mode
		routeBuilder.start(trimmed, selectedColor);

		// Ensure sites are visible while building a route
		layerStore.showAllSites();

		handleClose();
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={handleBackdropClick}>
		<div class="modal">
			<div class="header">
				<h2>Create Route</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<form class="form" onsubmit={e => { e.preventDefault(); handleStart(); }}>
				<div class="field">
					<label for="route-name">Route Name</label>
					<input
						id="route-name"
						type="text"
						bind:value={name}
						placeholder="e.g. South Bank Stroll"
						required
					/>
				</div>

				<div class="field">
					<label>Colour</label>
					<div class="swatches">
						{#each COLOR_SWATCHES as swatch}
							<button
								type="button"
								class="swatch"
								class:selected={selectedColor === swatch.value}
								style="background-color: {swatch.value}"
								onclick={() => selectedColor = swatch.value}
								aria-label={swatch.name}
							></button>
						{/each}
					</div>
				</div>

				{#if error}
					<p class="error">{error}</p>
				{/if}

				<p class="hint">After pressing Start, tap markers on the map to add them as stops in order.</p>

				<div class="actions">
					<button type="button" class="btn-cancel" onclick={handleClose}>Cancel</button>
					<button type="submit" class="btn-start">Start</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
	}

	.modal {
		background: white;
		width: 100%;
		max-width: 400px;
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		color: var(--color-primary);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-lg);
		border-bottom: 1px solid #e5e7eb;
	}

	.header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
	}

	.close-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: #f3f4f6;
		color: #374151;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.close-btn:active {
		background: #e5e7eb;
	}

	.form {
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field label {
		font-size: 13px;
		font-weight: 600;
		color: #374151;
	}

	.field input {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-family: inherit;
		color: var(--color-primary);
		background: white;
		-webkit-appearance: none;
	}

	.field input:focus {
		outline: none;
		border-color: var(--color-highlight);
		box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
	}

	.swatches {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	.swatch {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 3px solid transparent;
		cursor: pointer;
		transition: transform 0.1s ease-out;
		-webkit-tap-highlight-color: transparent;
	}

	.swatch.selected {
		border-color: var(--color-primary);
		transform: scale(1.15);
	}

	.swatch:active {
		transform: scale(0.92);
	}

	.hint {
		font-size: 13px;
		color: #6b7280;
		background: #f9fafb;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
	}

	.error {
		font-size: 13px;
		color: #dc2626;
		background: #fef2f2;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
	}

	.actions {
		display: flex;
		gap: var(--spacing-sm);
		padding-top: var(--spacing-sm);
	}

	.btn-cancel,
	.btn-start {
		flex: 1;
		padding: 12px;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
	}

	.btn-cancel {
		background: #f3f4f6;
		color: #374151;
	}

	.btn-cancel:active {
		background: #e5e7eb;
	}

	.btn-start {
		background: var(--color-highlight);
		color: white;
	}

	.btn-start:active {
		opacity: 0.85;
	}
</style>
