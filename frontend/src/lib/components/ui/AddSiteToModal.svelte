<script lang="ts">
	import { collectionsStore } from '$stores/collections';
	import { routesStore } from '$stores/routes';
	import { placesStore } from '$stores/places';
	import { placesApi, collectionsApi } from '$services/api';
	import type { Place } from '$types';

	interface Props {
		open: boolean;
		place: Place | null;
		onClose: () => void;
	}

	let { open, place, onClose }: Props = $props();

	let selectedRoute = $state('');
	let selectedCollections = $state<string[]>([]);
	let newCollectionName = $state('');
	let saving = $state(false);
	let error = $state('');

	$effect(() => {
		if (open) {
			collectionsStore.fetchAll();
			selectedRoute = place?.route || '';
			selectedCollections = [];
			newCollectionName = '';
			error = '';
		}
	});

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function toggleCollection(id: string) {
		if (selectedCollections.includes(id)) {
			selectedCollections = selectedCollections.filter(existing => existing !== id);
		} else {
			selectedCollections = [...selectedCollections, id];
		}
	}

	async function handleCreateCollection() {
		const trimmed = newCollectionName.trim();
		if (!trimmed) return;

		try {
			await collectionsApi.create({ name: trimmed });
			newCollectionName = '';
			await collectionsStore.fetchAll();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create collection';
			error = message;
		}
	}

	async function handleSave() {
		if (!place) return;
		saving = true;
		error = '';

		try {
			if (selectedCollections.length > 0) {
				await placesApi.addCollections(place.id, selectedCollections);
			}

			if (selectedRoute !== (place.route || '')) {
				await placesApi.update(place.id, {
					route: selectedRoute || null,
					route_stop: null
				});
			}

			await placesStore.fetchAll();
			onClose();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to update site';
			error = message;
		} finally {
			saving = false;
		}
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open && place}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={handleBackdropClick}>
		<div class="modal">
			<div class="header">
				<h2>Add {place.name} to...</h2>
				<button class="close-btn" onclick={onClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="content">
				<div class="section">
					<span class="section-title">Collections</span>
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

					<div class="create-collection">
						<input
							type="text"
							placeholder="New collection name"
							bind:value={newCollectionName}
						/>
						<button type="button" onclick={handleCreateCollection} disabled={!newCollectionName.trim()}>
							Create
						</button>
					</div>
				</div>

				<div class="section">
					<span class="section-title">Route</span>
					<select bind:value={selectedRoute}>
						<option value="">None</option>
						{#each Object.keys($routesStore) as r}
							<option value={r}>{r}</option>
						{/each}
					</select>
				</div>

				{#if error}
					<p class="error">{error}</p>
				{/if}
			</div>

			<div class="actions">
				<button class="btn-cancel" onclick={onClose}>Cancel</button>
				<button class="btn-save" onclick={handleSave} disabled={saving}>
					{saving ? 'Saving...' : 'Save'}
				</button>
			</div>
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
		max-width: 460px;
		max-height: 85vh;
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		color: var(--color-primary);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	.header {
		position: relative;
		padding: var(--spacing-lg);
		border-bottom: 1px solid #e5e7eb;
	}

	.header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		padding-right: 40px;
	}

	.close-btn {
		position: absolute;
		top: var(--spacing-md);
		right: var(--spacing-md);
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

	.content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		-webkit-overflow-scrolling: touch;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-title {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
	}

	.placeholder {
		margin: 0;
		font-size: 12px;
		color: #9ca3af;
		background: #f9fafb;
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
		background: #f9fafb;
		color: var(--color-primary);
		-webkit-tap-highlight-color: transparent;
	}

	.collection-label {
		font-size: 14px;
		font-weight: 500;
	}

	.create-collection {
		display: flex;
		gap: var(--spacing-sm);
	}

	.create-collection input {
		flex: 1;
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: var(--radius-md);
		font-size: 14px;
	}

	.create-collection button {
		padding: 10px 12px;
		border-radius: var(--radius-md);
		background: #111827;
		color: white;
		font-size: 14px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
	}

	select {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: var(--radius-md);
		font-size: 14px;
		background: white;
	}

	.actions {
		display: flex;
		gap: var(--spacing-sm);
		padding: var(--spacing-md) var(--spacing-lg) var(--spacing-lg);
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

	.btn-save {
		background: var(--color-highlight);
		color: white;
	}

	.btn-save:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		margin: 0;
		font-size: 12px;
		color: #dc2626;
		background: #fef2f2;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
	}
</style>
