<script lang="ts">
	import { placesStore } from '$stores/places';
	import { mapStore } from '$stores/map';
	import { ROUTE_COLORS, CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category, Priority } from '$types';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let name = $state('');
	let description = $state('');
	let route = $state('');
	let category = $state<Category>('history');
	let priority = $state<Priority>('route');
	let tagsInput = $state('');
	let saving = $state(false);
	let error = $state('');

	const routeNames = Object.keys(ROUTE_COLORS);
	const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];

	function reset() {
		name = '';
		description = '';
		route = '';
		category = 'history';
		priority = 'route';
		tagsInput = '';
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

	async function handleSubmit() {
		if (!name.trim()) {
			error = 'Name is required';
			return;
		}

		saving = true;
		error = '';

		const tags = tagsInput
			.split(',')
			.map(t => t.trim())
			.filter(t => t.length > 0);

		const [lat, lng] = $mapStore.center;

		const result = await placesStore.create({
			name: name.trim(),
			description: description.trim() || null,
			latitude: lat,
			longitude: lng,
			category,
			priority,
			route: route || null,
			tour_stop: null,
			tags
		});

		saving = false;

		if (result) {
			handleClose();
		} else {
			error = 'Failed to save point. Please try again.';
		}
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={handleBackdropClick}>
		<div class="modal">
			<div class="header">
				<h2>Add Point</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<form class="form" onsubmit={e => { e.preventDefault(); handleSubmit(); }}>
				<div class="field">
					<label for="point-name">Name</label>
					<input
						id="point-name"
						type="text"
						bind:value={name}
						placeholder="e.g. St Paul's Cathedral"
						required
					/>
				</div>

				<div class="field">
					<label for="point-route">Tour</label>
					<select id="point-route" bind:value={route}>
						<option value="">None</option>
						{#each routeNames as r}
							<option value={r}>{r}</option>
						{/each}
					</select>
				</div>

				<div class="row">
					<div class="field">
						<label for="point-category">Category</label>
						<select id="point-category" bind:value={category}>
							{#each categories as [value, label]}
								<option {value}>{label}</option>
							{/each}
						</select>
					</div>

					<div class="field">
						<label for="point-priority">Type</label>
						<select id="point-priority" bind:value={priority}>
							<option value="site">Site</option>
							<option value="route">Route</option>
						</select>
					</div>
				</div>

				<div class="field">
					<label for="point-description">Description</label>
					<textarea
						id="point-description"
						bind:value={description}
						placeholder="Describe this place..."
						rows="3"
					></textarea>
				</div>

				<div class="field">
					<label for="point-tags">Tags</label>
					<input
						id="point-tags"
						type="text"
						bind:value={tagsInput}
						placeholder="e.g. church, wren, baroque"
					/>
					<span class="hint">Comma-separated</span>
				</div>

				<p class="coord-info">
					Point will be placed at the current map centre.
				</p>

				{#if error}
					<p class="error">{error}</p>
				{/if}

				<div class="actions">
					<button type="button" class="btn-cancel" onclick={handleClose}>Cancel</button>
					<button type="submit" class="btn-save" disabled={saving}>
						{saving ? 'Saving...' : 'Add Point'}
					</button>
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
		max-width: 440px;
		max-height: 85vh;
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
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		-webkit-overflow-scrolling: touch;
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

	.field input,
	.field select,
	.field textarea {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-family: inherit;
		color: var(--color-primary);
		background: white;
		-webkit-appearance: none;
	}

	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--color-highlight);
		box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
	}

	.field textarea {
		resize: vertical;
		min-height: 60px;
	}

	.row {
		display: flex;
		gap: var(--spacing-md);
	}

	.row .field {
		flex: 1;
	}

	.hint {
		font-size: 12px;
		color: #9ca3af;
	}

	.coord-info {
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
	.btn-save {
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

	.btn-save {
		background: var(--color-highlight);
		color: white;
	}

	.btn-save:active:not(:disabled) {
		opacity: 0.85;
	}

	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
