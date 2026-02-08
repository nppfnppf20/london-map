<script lang="ts">
	import { geocodeApi, type GeocodedPlace } from '$services/api';
	import { mapStore } from '$stores/map';

	let query = $state('');
	let results = $state<GeocodedPlace[]>([]);
	let loading = $state(false);
	let showResults = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let inputEl: HTMLInputElement;

	function handleInput() {
		if (debounceTimer) clearTimeout(debounceTimer);

		if (query.trim().length < 2) {
			results = [];
			showResults = false;
			return;
		}

		debounceTimer = setTimeout(async () => {
			loading = true;
			try {
				results = await geocodeApi.autocomplete(query.trim());
				showResults = results.length > 0;
			} catch (e) {
				console.error('Autocomplete error:', e);
				results = [];
			} finally {
				loading = false;
			}
		}, 200);
	}

	function selectResult(place: GeocodedPlace) {
		mapStore.flyTo([place.latitude, place.longitude], 17);
		query = '';
		results = [];
		showResults = false;
		inputEl?.blur();
	}

	function handleFocus() {
		if (results.length > 0) {
			showResults = true;
		}
	}

	function handleBlur() {
		// Delay to allow click on result
		setTimeout(() => {
			showResults = false;
		}, 200);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			showResults = false;
			inputEl?.blur();
		}
	}

	function clearSearch() {
		query = '';
		results = [];
		showResults = false;
	}
</script>

<div class="search-container">
	<div class="search-input-wrapper">
		<svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8"/>
			<path d="M21 21l-4.35-4.35"/>
		</svg>
		<input
			bind:this={inputEl}
			bind:value={query}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeydown}
			type="text"
			placeholder="Search London..."
			class="search-input"
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
		/>
		{#if loading}
			<div class="spinner"></div>
		{:else if query.length > 0}
			<button class="clear-btn" onclick={clearSearch} aria-label="Clear search">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12"/>
				</svg>
			</button>
		{/if}
	</div>

	{#if showResults}
		<ul class="results-list">
			{#each results as place}
				<li>
					<button class="result-item" onclick={() => selectResult(place)}>
						<svg class="result-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
							<circle cx="12" cy="10" r="3"/>
						</svg>
						<div class="result-text">
							<span class="result-name">{place.name}</span>
							<span class="result-address">{place.displayName}</span>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.search-container {
		position: absolute;
		top: calc(env(safe-area-inset-top, 0px) + var(--spacing-md));
		left: var(--spacing-md);
		right: calc(var(--spacing-md) + 140px); /* Leave room for Toggle map */
		z-index: 1100;
		max-width: 520px;
	}

	@media (min-width: 500px) {
		.search-container {
			right: var(--spacing-md);
		}
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		background: white;
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		height: var(--control-height);
	}

	.search-icon {
		position: absolute;
		left: 12px;
		color: #9ca3af;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 0 40px 0 40px;
		height: var(--control-height);
		border: none;
		border-radius: var(--radius-lg);
		font-size: 13px;
		color: var(--color-primary);
		background: transparent;
	}

	.search-input::placeholder {
		color: #9ca3af;
	}

	.search-input:focus {
		outline: none;
	}

	.clear-btn {
		position: absolute;
		right: 8px;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #f3f4f6;
		color: #6b7280;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.clear-btn:active {
		background: #e5e7eb;
	}

	.spinner {
		position: absolute;
		right: 12px;
		width: 18px;
		height: 18px;
		border: 2px solid #e5e7eb;
		border-top-color: var(--color-highlight);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.results-list {
		position: absolute;
		top: calc(100% + 8px);
		left: 0;
		right: 0;
		background: white;
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		list-style: none;
		margin: 0;
		padding: 6px;
		max-height: 300px;
		overflow-y: auto;
	}

	.result-item {
		width: 100%;
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 10px;
		border-radius: var(--radius-md);
		text-align: left;
		background: transparent;
		-webkit-tap-highlight-color: transparent;
	}

	.result-item:hover,
	.result-item:focus {
		background: #f3f4f6;
	}

	.result-icon {
		flex-shrink: 0;
		color: #9ca3af;
		margin-top: 2px;
	}

	.result-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.result-name {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-primary);
	}

	.result-address {
		font-size: 12px;
		color: #6b7280;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
