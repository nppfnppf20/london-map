<script lang="ts">
	import { placesStore } from '$stores/places';
	import { mapStore } from '$stores/map';
	import { routesStore } from '$stores/routes';
	import { collectionsStore } from '$stores/collections';
	import { CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category, Priority } from '$types';

	interface Props {
		open: boolean;
		onClose: () => void;
		coords?: [number, number] | null;
		onCreateRoute?: () => void;
	}

	let { open, onClose, coords = null, onCreateRoute }: Props = $props();

	let name = $state('');
	let description = $state('');
	let route = $state('');
	let category = $state<Category | ''>('');
	let priority = $state<Priority>('site');
	let saving = $state(false);
	let error = $state('');
	let location = $state<[number, number] | null>(coords);
	let selectedCollections = $state<string[]>([]);

	$effect(() => {
		if (open) {
			location = coords ?? $mapStore.center;
			collectionsStore.fetchAll();
		}
	});

	const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];

	function reset() {
		name = '';
		description = '';
		route = '';
		category = '';
		priority = 'site';
		error = '';
		location = null;
		selectedCollections = [];
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
		if (!category) {
			error = 'Category is required';
			return;
		}

		saving = true;
		error = '';

		const [lat, lng] = location ?? $mapStore.center;

		const result = await placesStore.create({
			name: name.trim(),
			description: description.trim() || null,
			latitude: lat,
			longitude: lng,
			category: category as Category,
			priority,
			route: route || null,
			route_stop: null,
			tags: [],
			collection_ids: selectedCollections
		});

		saving = false;

		if (result) {
			handleClose();
		} else {
			error = 'Failed to save point. Please try again.';
		}
	}

	function handleRouteChange(value: string) {
		if (value === '__create__') {
			route = '';
			onCreateRoute?.();
			return;
		}
		route = value;
	}

	function toggleCollection(id: string) {
		if (selectedCollections.includes(id)) {
			selectedCollections = selectedCollections.filter(existing => existing !== id);
		} else {
			selectedCollections = [...selectedCollections, id];
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

				<div class="row">
					<div class="field">
						<label for="point-category">Category</label>
						<select id="point-category" bind:value={category}>
							<option value="" disabled>Select a category</option>
							{#each categories as [value, label]}
								<option {value}>{label}</option>
							{/each}
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

				<div class="section">
					<span class="section-title">Step 1 — Add to Collections</span>
					{#if $collectionsStore.loading}
						<p class="placeholder">Loading collections...</p>
					{:else if $collectionsStore.collections.length === 0}
						<p class="placeholder">No collections yet.</p>
					{:else}
						<div class="collection-list">
							{#each $collectionsStore.collections as collection}
								<label class="collection-item">
									<input
										type="checkbox"
										checked={selectedCollections.includes(collection.id)}
										onchange={() => toggleCollection(collection.id)}
									/>
									<span class="collection-label">{collection.name}</span>
								</label>
							{/each}
						</div>
					{/if}
				</div>

				<div class="section">
					<span class="section-title">Step 2 — Add to Route</span>
					<div class="field">
						<label for="point-route">Route</label>
						<select
							id="point-route"
							bind:value={route}
							onchange={(e) => handleRouteChange((e.currentTarget as HTMLSelectElement).value)}
						>
							<option value="">None</option>
							{#each Object.keys($routesStore) as r}
								<option value={r}>{r}</option>
							{/each}
							<option value="__create__">+ Create new route...</option>
						</select>
					</div>
				</div>

				<p class="coord-info">
					Point will be placed at {location ? `${location[0].toFixed(6)}, ${location[1].toFixed(6)}` : 'the current map centre'}.
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
		max-width: 440px;
		max-height: 85vh;
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
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.field input,
	.field select,
	.field textarea {
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

	.field input:focus,
	.field select:focus,
	.field textarea:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-subtle);
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

	.section {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.section-title {
		font-family: var(--font-ui);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.placeholder {
		margin: 0;
		font-size: 12px;
		color: var(--text-muted);
		background: var(--surface-raised);
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
	}

	.collection-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.collection-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		color: var(--text);
		-webkit-tap-highlight-color: transparent;
		transition: background 0.12s ease;
	}

	.collection-label {
		font-size: 14px;
		font-weight: 500;
	}

	.coord-info {
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
	.btn-save {
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

	.btn-save {
		background: var(--accent);
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
