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
		background: rgba(28, 25, 23, 0.5);
		z-index: 2000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
	}

	.modal {
		background: var(--surface);
		width: 100%;
		max-width: 400px;
		border-radius: var(--radius-xl);
		border: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		color: var(--text);
		box-shadow: var(--shadow-xl);
		overflow: hidden;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-lg);
		border-bottom: 1px solid var(--border);
	}

	.header h2 {
		margin: 0;
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--text);
	}

	.close-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
		transition: background 0.12s ease;
	}

	.close-btn:active {
		background: var(--border);
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
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.field input {
		padding: 10px 12px;
		border: 1px solid var(--border-strong);
		border-radius: var(--radius-md);
		font-size: 15px;
		font-family: inherit;
		color: var(--text);
		background: var(--surface-input);
		-webkit-appearance: none;
		transition: border-color 0.12s ease, box-shadow 0.12s ease;
	}

	.field input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-subtle);
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
		border-color: var(--text);
		transform: scale(1.15);
	}

	.swatch:active {
		transform: scale(0.92);
	}

	.hint {
		font-size: 13px;
		color: var(--text-muted);
		background: var(--surface-raised);
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
	}

	.error {
		font-size: 13px;
		color: var(--accent);
		background: rgba(233, 69, 96, 0.08);
		border: 1px solid rgba(233, 69, 96, 0.2);
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
		font-family: var(--font-ui);
		font-size: 15px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
		transition: opacity 0.12s ease, background 0.12s ease;
	}

	.btn-cancel {
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.btn-cancel:active {
		background: var(--border);
	}

	.btn-start {
		background: var(--accent);
		color: white;
	}

	.btn-start:active {
		opacity: 0.85;
	}
</style>
