<script lang="ts">
	import { routeSearchStore } from '$stores/routeSearch';
	import { nearbyStore } from '$stores/nearby';
	import { routesStore } from '$stores/routes';
	import { collectionsStore } from '$stores/collections';
	import { CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category, RouteSearchMode } from '$types';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let mode = $state<RouteSearchMode>('sites');
	let widthMeters = $state(200);
	let useAllCategories = $state(true);
	let useAllRoutes = $state(true);
	let selectedCategories = $state<Category[]>([]);
	let selectedRoutes = $state<string[]>([]);
	let selectedCollections = $state<string[]>([]);
	let step = $state<1 | 2 | 3>(1);
	let searching = $state(false);
	let error = $state('');

	const categories = Object.entries(CATEGORY_LABELS) as [Category, string][];

	$effect(() => {
		if (open) {
			collectionsStore.fetchAll();
			error = '';
			searching = false;

			if ($routeSearchStore.active) {
				mode = $routeSearchStore.mode;
				widthMeters = $routeSearchStore.widthMeters;
				useAllCategories = $routeSearchStore.categories.length === 0;
				useAllRoutes = $routeSearchStore.routes.length === 0;
				selectedCategories = [...$routeSearchStore.categories];
				selectedRoutes = [...$routeSearchStore.routes];
				selectedCollections = [...$routeSearchStore.collectionIds];
				step = 3;
			} else {
				mode = 'sites';
				widthMeters = 200;
				useAllCategories = true;
				useAllRoutes = true;
				selectedCategories = [];
				selectedRoutes = [];
				selectedCollections = [];
				step = 1;
			}
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

	function toggleCategory(category: Category) {
		if (selectedCategories.includes(category)) {
			selectedCategories = selectedCategories.filter(existing => existing !== category);
		} else {
			selectedCategories = [...selectedCategories, category];
		}
	}

	function toggleRoute(route: string) {
		if (selectedRoutes.includes(route)) {
			selectedRoutes = selectedRoutes.filter(existing => existing !== route);
		} else {
			selectedRoutes = [...selectedRoutes, route];
		}
	}

	function toggleCollection(id: string) {
		if (selectedCollections.includes(id)) {
			selectedCollections = selectedCollections.filter(existing => existing !== id);
		} else {
			selectedCollections = [...selectedCollections, id];
		}
	}

	function formatWidth(value: number) {
		return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${value} m`;
	}

	function canAdvanceStep2() {
		if (mode === 'sites') {
			return useAllCategories || selectedCategories.length > 0;
		}
		if (mode === 'routes') {
			return useAllRoutes || selectedRoutes.length > 0;
		}
		return selectedCollections.length > 0;
	}

	function handleNextStep2() {
		error = '';
		if (!canAdvanceStep2()) {
			error = 'Select at least one option to continue.';
			return;
		}
		step = 3;
	}

	function handleBack() {
		error = '';
		if (step === 3) {
			step = 2;
			return;
		}
		if (step === 2) {
			step = 1;
		}
	}

	async function handleSearch() {
		error = '';

		if ($routeSearchStore.line.length < 2) {
			error = 'Draw a route first.';
			return;
		}

		if (!canAdvanceStep2()) {
			error = 'Select at least one option.';
			step = 2;
			return;
		}

		searching = true;
		nearbyStore.clear();

		const searchOk = await routeSearchStore.search({
			line: $routeSearchStore.line,
			widthMeters,
			mode,
			categories: mode === 'sites' && !useAllCategories ? selectedCategories : undefined,
			routes: mode === 'routes' && !useAllRoutes ? selectedRoutes : undefined,
			collectionIds: mode === 'collections' ? selectedCollections : undefined
		});

		searching = false;

		if (searchOk) {
			onClose();
		} else {
			error = $routeSearchStore.error ?? 'Failed to search along route.';
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
				<h2>Find along route</h2>
				<button class="close-btn" onclick={onClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="form">
				{#if step === 1}
					<div class="section">
						<span class="section-title">Step 1 - What are you looking for?</span>
						<div class="choice-grid">
							<button
								class="choice-btn card-btn"
								onclick={() => {
									mode = 'sites';
									useAllCategories = true;
									selectedCategories = [];
									step = 3;
								}}
							>
								Anything
							</button>
							<button
								class="choice-btn card-btn"
								onclick={() => {
									mode = 'sites';
									step = 2;
								}}
							>
								Sites
							</button>
							<button
								class="choice-btn card-btn"
								onclick={() => {
									mode = 'routes';
									step = 2;
								}}
							>
								Routes
							</button>
							<button
								class="choice-btn card-btn"
								onclick={() => {
									mode = 'collections';
									step = 2;
								}}
							>
								From a collection
							</button>
						</div>
					</div>
				{:else if step === 2}
					{#if mode === 'sites'}
						<div class="section">
							<span class="section-title">Step 2 - Which categories?</span>
							<label class="toggle">
								<input type="checkbox" bind:checked={useAllCategories} />
								<span>All categories</span>
							</label>
							<div class="option-list">
								{#each categories as [value, label]}
									<label class="option-item">
										<input
											type="checkbox"
											checked={selectedCategories.includes(value)}
											onchange={() => toggleCategory(value)}
											disabled={useAllCategories}
										/>
										<span>{label}</span>
									</label>
								{/each}
							</div>
						</div>
					{:else if mode === 'routes'}
						<div class="section">
							<span class="section-title">Step 2 - Any route in particular?</span>
							<label class="toggle">
								<input type="checkbox" bind:checked={useAllRoutes} />
								<span>All routes</span>
							</label>
							{#if !useAllRoutes}
								<div class="option-list">
									{#each Object.keys($routesStore) as route}
										<label class="option-item">
											<input
												type="checkbox"
												checked={selectedRoutes.includes(route)}
												onchange={() => toggleRoute(route)}
											/>
											<span>{route}</span>
										</label>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="section">
							<span class="section-title">Step 2 - Choose collections</span>
							{#if $collectionsStore.loading}
								<p class="placeholder">Loading collections...</p>
							{:else if $collectionsStore.collections.length === 0}
								<p class="placeholder">No collections yet.</p>
							{:else}
								<div class="option-list">
									{#each $collectionsStore.collections as collection}
										<label class="option-item">
											<input
												type="checkbox"
												checked={selectedCollections.includes(collection.id)}
												onchange={() => toggleCollection(collection.id)}
											/>
											<span>{collection.name}</span>
										</label>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				{:else}
					<div class="section">
						<span class="section-title">Step 3 - Width</span>
						<div class="radius">
							<input
								type="range"
								min="50"
								max="1000"
								step="25"
								value={widthMeters}
								oninput={(event) => {
									widthMeters = Number((event.currentTarget as HTMLInputElement).value);
								}}
							/>
							<span class="radius-value">{formatWidth(widthMeters)}</span>
						</div>
						<p class="coord-info">
							Searching along your drawn route.
						</p>
					</div>
				{/if}

				{#if error}
					<p class="error">{error}</p>
				{/if}

				<div class="actions">
					<button type="button" class="btn-cancel" onclick={step === 1 ? onClose : handleBack}>
						{step === 1 ? 'Cancel' : 'Back'}
					</button>
					{#if step === 2}
						<button type="button" class="btn-save" onclick={handleNextStep2}>
							Next
						</button>
					{:else if step === 3}
						<button type="button" class="btn-save" onclick={handleSearch} disabled={searching}>
							{searching ? 'Searching...' : 'Show results'}
						</button>
					{/if}
				</div>
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
		cursor: default;
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

	.choice-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-sm);
		grid-auto-rows: 1fr;
	}

	.card-btn {
		border-radius: 18px;
		background: linear-gradient(180deg, #ffffff, #f1f5f9);
		color: #0f172a;
		border: 1px solid #e2e8f0;
		box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
		min-height: 120px;
		padding: 18px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		font-size: 17px;
		font-weight: 800;
		letter-spacing: 0.02em;
		transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
	}

	.card-btn:active {
		transform: translateY(2px) scale(0.98);
		box-shadow: 0 6px 14px rgba(15, 23, 42, 0.16);
	}

	.toggle {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 600;
		color: #374151;
	}

	.toggle input {
		accent-color: var(--color-highlight);
	}

	.option-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.option-item {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: 8px 10px;
		border-radius: var(--radius-sm);
		background: #f9fafb;
		color: var(--color-primary);
		font-size: 14px;
		font-weight: 500;
	}

	.option-item input {
		accent-color: var(--color-highlight);
	}

	.placeholder {
		margin: 0;
		font-size: 12px;
		color: #9ca3af;
		background: #f9fafb;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
	}

	.radius {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.radius input[type="range"] {
		flex: 1;
		accent-color: var(--color-highlight);
	}

	.radius-value {
		font-size: 13px;
		font-weight: 600;
		color: #374151;
		min-width: 64px;
		text-align: right;
	}

	.coord-info {
		font-size: 13px;
		color: #6b7280;
		background: #f9fafb;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		margin: 0;
	}

	.error {
		font-size: 13px;
		color: #dc2626;
		background: #fef2f2;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		margin: 0;
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

	.btn-save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
