<script lang="ts">
	import { authStore } from '$stores/auth';
	import { routesStore } from '$stores/routes';
	import { goto } from '$app/navigation';
	import { placesApi, collectionsApi, shareLinksApi } from '$services/api';
	import type { Place, Collection, ShareLink } from '$types';

	let places = $state<Place[]>([]);
	let collections = $state<Collection[]>([]);
	let existingLinks = $state<ShareLink[]>([]);
	let loading = $state(true);
	let error = $state('');

	// Selection state
	let selectedPlaces = $state<Set<string>>(new Set());
	let selectedCollections = $state<Set<string>>(new Set());
	let selectedRoutes = $state<Set<string>>(new Set());
	let linkName = $state('');

	// Result state
	let generatedUrl = $state('');
	let copied = $state(false);
	let creating = $state(false);

	$effect(() => {
		if (!$authStore.loading && (!$authStore.user || $authStore.user.role !== 'admin')) {
			goto('/profile');
		}
	});

	$effect(() => {
		if ($authStore.user?.role === 'admin') {
			loadData();
		}
	});

	async function loadData() {
		loading = true;
		error = '';
		try {
			const [p, c, links] = await Promise.all([
				placesApi.getAll(),
				collectionsApi.getAll(),
				shareLinksApi.getAll()
			]);
			places = p;
			collections = c;
			existingLinks = links;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load data';
		} finally {
			loading = false;
		}
	}

	function togglePlace(id: string) {
		const next = new Set(selectedPlaces);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedPlaces = next;
	}

	function toggleCollection(id: string) {
		const next = new Set(selectedCollections);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedCollections = next;
	}

	function toggleRoute(name: string) {
		const next = new Set(selectedRoutes);
		if (next.has(name)) next.delete(name);
		else next.add(name);
		selectedRoutes = next;
	}

	function toggleAllCollections() {
		if (selectedCollections.size === collections.length) {
			selectedCollections = new Set();
		} else {
			selectedCollections = new Set(collections.map(c => c.id));
		}
	}

	function toggleAllRoutes() {
		const routeNames = Object.keys($routesStore);
		if (selectedRoutes.size === routeNames.length) {
			selectedRoutes = new Set();
		} else {
			selectedRoutes = new Set(routeNames);
		}
	}

	function toggleAllPlaces() {
		if (selectedPlaces.size === places.length) {
			selectedPlaces = new Set();
		} else {
			selectedPlaces = new Set(places.map(p => p.id));
		}
	}

	let canCreate = $derived(
		linkName.trim() && (selectedPlaces.size > 0 || selectedCollections.size > 0 || selectedRoutes.size > 0)
	);

	async function createLink() {
		if (!canCreate) return;
		creating = true;
		error = '';
		try {
			const link = await shareLinksApi.create({
				name: linkName.trim(),
				place_ids: Array.from(selectedPlaces),
				collection_ids: Array.from(selectedCollections),
				route_names: Array.from(selectedRoutes)
			});
			generatedUrl = `${window.location.origin}/share/${link.token}`;
			copied = false;
			existingLinks = [link, ...existingLinks];
			// Reset selection
			linkName = '';
			selectedPlaces = new Set();
			selectedCollections = new Set();
			selectedRoutes = new Set();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create share link';
		} finally {
			creating = false;
		}
	}

	function copyUrl() {
		navigator.clipboard.writeText(generatedUrl);
		copied = true;
	}

	async function revokeLink(id: string) {
		try {
			await shareLinksApi.delete(id);
			existingLinks = existingLinks.filter(l => l.id !== id);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to revoke link';
		}
	}
</script>

<div class="admin-page">
	<div class="admin-header">
		<a href="/profile" class="back-btn" aria-label="Back to profile">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M15 18l-6-6 6-6"/>
			</svg>
		</a>
		<h1>Admin</h1>
	</div>

	{#if loading}
		<div class="admin-content">
			<p class="meta">Loading...</p>
		</div>
	{:else}
		<div class="admin-content">
			{#if error}
				<p class="error">{error}</p>
			{/if}

			{#if generatedUrl}
				<div class="result-card">
					<h3>Link created</h3>
					<div class="url-row">
						<input type="text" readonly value={generatedUrl} class="url-input" />
						<button class="copy-btn" onclick={copyUrl}>
							{copied ? 'Copied!' : 'Copy'}
						</button>
					</div>
					<button class="dismiss-btn" onclick={() => generatedUrl = ''}>Dismiss</button>
				</div>
			{/if}

			<section class="create-section">
				<h2>Create Share Link</h2>

				<div class="field">
					<label for="link-name">Link name</label>
					<input
						id="link-name"
						type="text"
						bind:value={linkName}
						placeholder="e.g. London Highlights for Tom"
					/>
				</div>

				<div class="section-header">
					<h3 class="section-label">Collections ({selectedCollections.size} selected)</h3>
					{#if collections.length > 0}
						<button class="select-all-btn" type="button" onclick={toggleAllCollections}>
							{selectedCollections.size === collections.length ? 'Deselect all' : 'Select all'}
						</button>
					{/if}
				</div>
				<div class="select-list">
					{#each collections as collection}
						<button
							class="select-item"
							class:selected={selectedCollections.has(collection.id)}
							type="button"
							onclick={() => toggleCollection(collection.id)}
						>
							<span
								class="check"
								class:checked={selectedCollections.has(collection.id)}
								style={selectedCollections.has(collection.id) ? `background:${collection.color || '#94a3b8'}; border-color:${collection.color || '#94a3b8'}` : ''}
							></span>
							<span class="select-item-dot" style={`background:${collection.color || '#94a3b8'}`}></span>
							<span class="select-item-name">{collection.name}</span>
						</button>
					{:else}
						<p class="meta">No collections</p>
					{/each}
				</div>

				<div class="section-header">
					<h3 class="section-label">Routes ({selectedRoutes.size} selected)</h3>
					{#if Object.keys($routesStore).length > 0}
						<button class="select-all-btn" type="button" onclick={toggleAllRoutes}>
							{selectedRoutes.size === Object.keys($routesStore).length ? 'Deselect all' : 'Select all'}
						</button>
					{/if}
				</div>
				<div class="select-list">
					{#each Object.entries($routesStore) as [name, color]}
						<button
							class="select-item"
							class:selected={selectedRoutes.has(name)}
							type="button"
							onclick={() => toggleRoute(name)}
						>
							<span
								class="check"
								class:checked={selectedRoutes.has(name)}
								style={selectedRoutes.has(name) ? `background:${color}; border-color:${color}` : ''}
							></span>
							<span class="select-item-dot" style={`background:${color}`}></span>
							<span class="select-item-name">{name}</span>
						</button>
					{:else}
						<p class="meta">No routes</p>
					{/each}
				</div>

				<div class="section-header">
					<h3 class="section-label">Places ({selectedPlaces.size} selected)</h3>
					{#if places.length > 0}
						<button class="select-all-btn" type="button" onclick={toggleAllPlaces}>
							{selectedPlaces.size === places.length ? 'Deselect all' : 'Select all'}
						</button>
					{/if}
				</div>
				<div class="select-list">
					{#each places as place}
						<button
							class="select-item"
							class:selected={selectedPlaces.has(place.id)}
							type="button"
							onclick={() => togglePlace(place.id)}
						>
							<span
								class="check"
								class:checked={selectedPlaces.has(place.id)}
							></span>
							<span class="select-item-name">{place.name}</span>
							<span class="select-item-meta">{place.category}</span>
						</button>
					{:else}
						<p class="meta">No places</p>
					{/each}
				</div>

				<button
					class="create-btn"
					disabled={!canCreate || creating}
					onclick={createLink}
				>
					{creating ? 'Creating...' : 'Create Share Link'}
				</button>
			</section>

			{#if existingLinks.length > 0}
				<section class="links-section">
					<h2>Active Share Links</h2>
					<div class="links-list">
						{#each existingLinks as link}
							<div class="link-card">
								<div class="link-info">
									<p class="link-name">{link.name}</p>
									<p class="link-meta">
										{link.collection_ids.length} collections, {link.route_names.length} routes, {link.place_ids.length} places
									</p>
									<p class="link-meta">
										Created {new Date(link.created_at).toLocaleDateString()}
									</p>
								</div>
								<div class="link-actions">
									<button
										class="link-copy-btn"
										onclick={() => {
											generatedUrl = `${window.location.origin}/share/${link.token}`;
											copied = false;
										}}
									>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<rect x="9" y="9" width="13" height="13" rx="2"/>
											<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
										</svg>
									</button>
									<button
										class="link-revoke-btn"
										onclick={() => revokeLink(link.id)}
									>
										<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
										</svg>
									</button>
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	{/if}
</div>

<style>
	.admin-page {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #f9fafb;
		color: var(--color-primary);
	}

	.admin-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top, 0px));
		background: white;
		border-bottom: 1px solid #e5e7eb;
	}

	.admin-header h1 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
	}

	.back-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #f3f4f6;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #374151;
		text-decoration: none;
		-webkit-tap-highlight-color: transparent;
	}

	.back-btn:active {
		background: #e5e7eb;
	}

	.admin-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		-webkit-overflow-scrolling: touch;
		padding-bottom: calc(var(--spacing-lg) + env(safe-area-inset-bottom, 0px));
	}

	.meta {
		text-align: center;
		color: #9ca3af;
		font-size: 14px;
	}

	.error {
		font-size: 13px;
		color: #dc2626;
		background: #fef2f2;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		margin: 0;
	}

	h2 {
		margin: 0 0 12px;
		font-size: 17px;
		font-weight: 700;
		color: #0f172a;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 16px 0 8px;
	}

	h3.section-label {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.select-all-btn {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-highlight, #6366f1);
		background: none;
		padding: 4px 8px;
		-webkit-tap-highlight-color: transparent;
	}

	.select-all-btn:active {
		opacity: 0.7;
	}

	.field {
		margin-bottom: 8px;
	}

	.field label {
		display: block;
		font-size: 13px;
		font-weight: 600;
		color: #6b7280;
		margin-bottom: 6px;
	}

	.field input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: var(--radius-md);
		font-size: 14px;
		color: #0f172a;
		box-sizing: border-box;
	}

	.select-list {
		background: white;
		border-radius: var(--radius-lg);
		border: 1px solid #e5e7eb;
		overflow: hidden;
		max-height: 240px;
		overflow-y: auto;
	}

	.select-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		padding: 12px 14px;
		text-align: left;
		border-bottom: 1px solid #f3f4f6;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		background: none;
	}

	.select-item:last-child {
		border-bottom: none;
	}

	.select-item:active {
		background: #f9fafb;
	}

	.check {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		border-radius: 6px;
		border: 2px solid #cbd5e1;
		background: white;
		transition: background 0.15s, border-color 0.15s;
	}

	.check.checked {
		background: var(--color-highlight, #6366f1);
		border-color: var(--color-highlight, #6366f1);
	}

	.select-item-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.select-item-name {
		flex: 1;
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.select-item-meta {
		font-size: 12px;
		color: #9ca3af;
		text-transform: capitalize;
	}

	.create-btn {
		width: 100%;
		padding: 14px;
		margin-top: 16px;
		border-radius: var(--radius-md);
		background: var(--color-highlight, #6366f1);
		color: white;
		font-size: 15px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
	}

	.create-btn:disabled {
		opacity: 0.5;
	}

	.create-btn:active:not(:disabled) {
		opacity: 0.9;
	}

	/* Result card */
	.result-card {
		background: #eef2ff;
		border: 1px solid #c7d2fe;
		border-radius: var(--radius-lg);
		padding: 16px;
	}

	.result-card h3 {
		margin: 0 0 10px;
		font-size: 15px;
		font-weight: 700;
		color: #4338ca;
	}

	.url-row {
		display: flex;
		gap: 8px;
		margin-bottom: 10px;
	}

	.url-input {
		flex: 1;
		padding: 10px 12px;
		border: 1px solid #c7d2fe;
		border-radius: 8px;
		font-size: 13px;
		color: #374151;
		background: white;
		min-width: 0;
	}

	.copy-btn {
		padding: 10px 16px;
		border-radius: 8px;
		background: #4338ca;
		color: white;
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
	}

	.dismiss-btn {
		width: 100%;
		padding: 10px;
		border-radius: 8px;
		background: transparent;
		color: #6366f1;
		font-size: 13px;
		font-weight: 600;
	}

	/* Existing links */
	.links-section {
		border-top: 1px solid #e5e7eb;
		padding-top: var(--spacing-lg);
	}

	.links-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.link-card {
		display: flex;
		align-items: center;
		gap: 12px;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: var(--radius-lg);
		padding: 14px;
	}

	.link-info {
		flex: 1;
		min-width: 0;
	}

	.link-name {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: #0f172a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.link-meta {
		margin: 2px 0 0;
		font-size: 12px;
		color: #9ca3af;
	}

	.link-actions {
		display: flex;
		gap: 6px;
		flex-shrink: 0;
	}

	.link-copy-btn,
	.link-revoke-btn {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.link-copy-btn {
		background: #f3f4f6;
		color: #6b7280;
	}

	.link-copy-btn:active {
		background: #e5e7eb;
	}

	.link-revoke-btn {
		background: #fef2f2;
		color: #dc2626;
	}

	.link-revoke-btn:active {
		background: #fecaca;
	}
</style>
