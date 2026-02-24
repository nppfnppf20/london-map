<script lang="ts">
	import { beaconsApi } from '$services/api';
	import { uploadBeaconImage } from '$services/storage';
	import { CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category } from '$types';

	const isDev = import.meta.env.DEV;

	const categories = (Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
		([value, label]) => ({ value, label })
	);

	let creatorName = $state('Test Creator');
	let creatorLat = $state(51.5074);
	let creatorLng = $state(-0.1278);
	let selectedCategories = $state<Set<Category>>(new Set(['food' as Category]));
	let creatorImagePath = $state<string | undefined>(undefined);
	let creatorUploading = $state(false);
	let creatorUploadError = $state('');
	let createLoading = $state(false);
	let createError = $state('');
	let createResult = $state<any>(null);

	let joinName = $state('Test Joiner');
	let joinLat = $state(51.5124);
	let joinLng = $state(-0.1178);
	let joinImagePath = $state<string | undefined>(undefined);
	let joinUploading = $state(false);
	let joinUploadError = $state('');
	let joinLoading = $state(false);
	let joinError = $state('');
	let joinResult = $state<any>(null);

	let token = $state('');
	let resolveLoading = $state(false);
	let resolveError = $state('');
	let resolvedBeacon = $state<any>(null);
	let midpointResult = $state<any>(null);
	let tokenHint = $state('');

	function toggleCategory(cat: Category) {
		const next = new Set(selectedCategories);
		if (next.has(cat)) next.delete(cat);
		else next.add(cat);
		selectedCategories = next;
	}

	function offsetCoords(baseLat: number, baseLng: number, metersNorth: number, metersEast: number) {
		const latDelta = metersNorth / 111320;
		const lngDelta = metersEast / (111320 * Math.cos((baseLat * Math.PI) / 180));
		return [baseLat + latDelta, baseLng + lngDelta] as [number, number];
	}

	function setCreatorPreset(preset: 'central' | 'north' | 'south' | 'east' | 'west') {
		const [baseLat, baseLng] = [51.5074, -0.1278];
		let coords: [number, number] = [baseLat, baseLng];
		if (preset === 'north') coords = offsetCoords(baseLat, baseLng, 2500, 0);
		if (preset === 'south') coords = offsetCoords(baseLat, baseLng, -2500, 0);
		if (preset === 'east') coords = offsetCoords(baseLat, baseLng, 0, 2500);
		if (preset === 'west') coords = offsetCoords(baseLat, baseLng, 0, -2500);
		[creatorLat, creatorLng] = coords;
	}

	function setJoinFromCreator() {
		joinLat = creatorLat;
		joinLng = creatorLng;
	}

	function setJoinRandomNearCreator() {
		const metersNorth = (Math.random() - 0.5) * 3000;
		const metersEast = (Math.random() - 0.5) * 3000;
		const [lat, lng] = offsetCoords(creatorLat, creatorLng, metersNorth, metersEast);
		joinLat = lat;
		joinLng = lng;
	}

	async function handleCreatorUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		creatorUploading = true;
		creatorUploadError = '';
		try {
			creatorImagePath = await uploadBeaconImage(file);
		} catch (err) {
			creatorUploadError = err instanceof Error ? err.message : 'Failed to upload photo';
		} finally {
			creatorUploading = false;
		}
	}

	async function handleJoinUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		joinUploading = true;
		joinUploadError = '';
		try {
			joinImagePath = await uploadBeaconImage(file);
		} catch (err) {
			joinUploadError = err instanceof Error ? err.message : 'Failed to upload photo';
		} finally {
			joinUploading = false;
		}
	}

	async function createBeacon() {
		createLoading = true;
		createError = '';
		createResult = null;
		try {
			const beacon = await beaconsApi.create({
				creator_name: creatorName.trim(),
				creator_lat: creatorLat,
				creator_lng: creatorLng,
				categories: [...selectedCategories],
				...(creatorImagePath ? { image_path: creatorImagePath } : {})
			});
			createResult = beacon;
			token = beacon.token;
			tokenHint = '';
		} catch (err) {
			createError = err instanceof Error ? err.message : 'Failed to create beacon';
		} finally {
			createLoading = false;
		}
	}

	function normalizeToken(input: string) {
		const trimmed = input.trim();
		if (!trimmed) return '';
		try {
			const url = new URL(trimmed);
			const path = url.pathname || '';
			const parts = path.split('/').filter(Boolean);
			const idx = parts.indexOf('beacon');
			if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
			return trimmed;
		} catch {
			const parts = trimmed.split('/').filter(Boolean);
			const idx = parts.indexOf('beacon');
			if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
			return trimmed;
		}
	}

	function getEffectiveToken() {
		const normalized = normalizeToken(token);
		if (token && normalized !== token) {
			tokenHint = `Using token ${normalized} extracted from pasted link.`;
		} else {
			tokenHint = '';
		}
		return normalized;
	}

	async function joinBeacon() {
		const effectiveToken = getEffectiveToken();
		if (!effectiveToken) return;
		joinLoading = true;
		joinError = '';
		joinResult = null;
		try {
			const beacon = await beaconsApi.join(effectiveToken, {
				name: joinName.trim(),
				lat: joinLat,
				lng: joinLng,
				...(joinImagePath ? { image_path: joinImagePath } : {})
			});
			joinResult = beacon;
		} catch (err) {
			joinError = err instanceof Error ? err.message : 'Failed to join beacon';
		} finally {
			joinLoading = false;
		}
	}

	async function addSimulatedParticipants(count: number) {
		const effectiveToken = getEffectiveToken();
		if (!effectiveToken) return;
		joinLoading = true;
		joinError = '';
		try {
			for (let i = 0; i < count; i += 1) {
				const metersNorth = (Math.random() - 0.5) * 4000;
				const metersEast = (Math.random() - 0.5) * 4000;
				const [lat, lng] = offsetCoords(creatorLat, creatorLng, metersNorth, metersEast);
				await beaconsApi.join(effectiveToken, {
					name: `Sim ${Date.now()}-${i + 1}`,
					lat,
					lng
				});
			}
		} catch (err) {
			joinError = err instanceof Error ? err.message : 'Failed to add simulated participants';
		} finally {
			joinLoading = false;
		}
	}

	async function resolveBeacon() {
		const effectiveToken = getEffectiveToken();
		if (!effectiveToken) return;
		resolveLoading = true;
		resolveError = '';
		resolvedBeacon = null;
		midpointResult = null;
		try {
			resolvedBeacon = await beaconsApi.resolve(effectiveToken);
			if (resolvedBeacon?.participants?.length) {
				midpointResult = await beaconsApi.midpoint(effectiveToken);
			}
		} catch (err) {
			resolveError = err instanceof Error ? err.message : 'Failed to resolve beacon';
		} finally {
			resolveLoading = false;
		}
	}

	async function copyJoinLink() {
		const effectiveToken = getEffectiveToken();
		if (!effectiveToken) return;
		const url = `${window.location.origin}/beacon/${effectiveToken}`;
		try {
			await navigator.clipboard.writeText(url);
		} catch {
			// Ignore clipboard failures in dev test page
		}
	}
</script>

{#if !isDev}
	<div class="gate">
		<h1>Beacon Test</h1>
		<p>This page is only available in dev mode.</p>
	</div>
{:else}
	<div class="page">
		<header class="header">
			<div>
				<h1>Beacon Test Harness</h1>
				<p>Use this page to create, join, and resolve beacons without map or geolocation.</p>
			</div>
			<div class="token-panel">
				<label for="token">Token or join link</label>
				<input id="token" type="text" bind:value={token} placeholder="Paste token or full link" />
				<div class="token-actions">
					<button class="btn" onclick={resolveBeacon} disabled={resolveLoading || !token.trim()}>
						{resolveLoading ? 'Resolving...' : 'Resolve'}
					</button>
					<button class="btn" onclick={copyJoinLink} disabled={!token.trim()}>Copy Join Link</button>
					<a class="btn ghost" href={token ? `/beacon/${normalizeToken(token)}` : '#'} target="_blank" rel="noreferrer">
						Open Join Page
					</a>
				</div>
				{#if tokenHint}
					<p class="meta">{tokenHint}</p>
				{/if}
				{#if resolveError}
					<p class="error">{resolveError}</p>
				{/if}
			</div>
		</header>

		<div class="grid">
			<section class="panel">
				<h2>Create Beacon</h2>
				<div class="field">
					<label for="creator-name">Creator name</label>
					<input id="creator-name" type="text" bind:value={creatorName} />
				</div>
				<div class="row">
					<div class="field">
						<label for="creator-lat">Latitude</label>
						<input id="creator-lat" type="number" step="0.0001" bind:value={creatorLat} />
					</div>
					<div class="field">
						<label for="creator-lng">Longitude</label>
						<input id="creator-lng" type="number" step="0.0001" bind:value={creatorLng} />
					</div>
				</div>
				<div class="row preset-row">
					<span class="label">Presets</span>
					<button class="btn ghost" onclick={() => setCreatorPreset('central')}>Central</button>
					<button class="btn ghost" onclick={() => setCreatorPreset('north')}>North</button>
					<button class="btn ghost" onclick={() => setCreatorPreset('south')}>South</button>
					<button class="btn ghost" onclick={() => setCreatorPreset('east')}>East</button>
					<button class="btn ghost" onclick={() => setCreatorPreset('west')}>West</button>
				</div>
				<div class="field">
					<label>Categories</label>
					<div class="chip-row">
						{#each categories as cat}
							<button
								class="chip"
								class:active={selectedCategories.has(cat.value)}
								onclick={() => toggleCategory(cat.value)}
							>
								{cat.label}
							</button>
						{/each}
					</div>
				</div>
				<div class="field">
					<label for="creator-photo">Photo (optional)</label>
					<input id="creator-photo" type="file" accept="image/*" oninput={handleCreatorUpload} />
					{#if creatorUploading}
						<p class="meta">Uploading...</p>
					{/if}
					{#if creatorUploadError}
						<p class="error">{creatorUploadError}</p>
					{/if}
					{#if creatorImagePath}
						<p class="meta">Uploaded: {creatorImagePath}</p>
					{/if}
				</div>
				<div class="actions">
					<button class="btn primary" onclick={createBeacon} disabled={createLoading}>
						{createLoading ? 'Creating...' : 'Create Beacon'}
					</button>
				</div>
				{#if createError}
					<p class="error">{createError}</p>
				{/if}
				{#if createResult}
					<pre>{JSON.stringify(createResult, null, 2)}</pre>
				{/if}
			</section>

			<section class="panel">
				<h2>Join Beacon</h2>
				<div class="field">
					<label for="join-name">Joiner name</label>
					<input id="join-name" type="text" bind:value={joinName} />
				</div>
				<div class="row">
					<div class="field">
						<label for="join-lat">Latitude</label>
						<input id="join-lat" type="number" step="0.0001" bind:value={joinLat} />
					</div>
					<div class="field">
						<label for="join-lng">Longitude</label>
						<input id="join-lng" type="number" step="0.0001" bind:value={joinLng} />
					</div>
				</div>
				<div class="row preset-row">
					<span class="label">Quick set</span>
					<button class="btn ghost" onclick={setJoinFromCreator}>Use creator coords</button>
					<button class="btn ghost" onclick={setJoinRandomNearCreator}>Random near creator</button>
				</div>
				<div class="field">
					<label for="join-photo">Photo (optional)</label>
					<input id="join-photo" type="file" accept="image/*" oninput={handleJoinUpload} />
					{#if joinUploading}
						<p class="meta">Uploading...</p>
					{/if}
					{#if joinUploadError}
						<p class="error">{joinUploadError}</p>
					{/if}
					{#if joinImagePath}
						<p class="meta">Uploaded: {joinImagePath}</p>
					{/if}
				</div>
				<div class="actions">
					<button class="btn primary" onclick={joinBeacon} disabled={joinLoading || !token}>
						{joinLoading ? 'Joining...' : 'Join Beacon'}
					</button>
					<button class="btn" onclick={() => addSimulatedParticipants(3)} disabled={joinLoading || !token}>
						Add 3 simulated
					</button>
					<button class="btn" onclick={() => addSimulatedParticipants(5)} disabled={joinLoading || !token}>
						Add 5 simulated
					</button>
				</div>
				{#if joinError}
					<p class="error">{joinError}</p>
				{/if}
				{#if joinResult}
					<pre>{JSON.stringify(joinResult, null, 2)}</pre>
				{/if}
			</section>
		</div>

		<section class="panel full">
			<h2>Resolved Beacon</h2>
			{#if resolvedBeacon}
				<pre>{JSON.stringify(resolvedBeacon, null, 2)}</pre>
			{:else}
				<p class="meta">No resolved beacon yet.</p>
			{/if}
			{#if midpointResult}
				<h3>Midpoint</h3>
				<pre>{JSON.stringify(midpointResult, null, 2)}</pre>
			{/if}
		</section>
	</div>
{/if}

<style>
	:global(body) {
		background: #0b1220;
		color: #e2e8f0;
	}

	.page {
		min-height: 100dvh;
		padding: 32px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.header {
		display: flex;
		flex-wrap: wrap;
		gap: 24px;
		align-items: flex-start;
		justify-content: space-between;
		background: #0f172a;
		border: 1px solid #1e293b;
		border-radius: 16px;
		padding: 20px;
		box-shadow: 0 16px 32px rgba(0, 0, 0, 0.25);
	}

	h1 {
		margin: 0 0 6px;
		font-size: 24px;
		font-weight: 700;
	}

	h2 {
		margin: 0 0 12px;
		font-size: 18px;
		font-weight: 700;
	}

	h3 {
		margin: 16px 0 8px;
		font-size: 15px;
		font-weight: 700;
	}

	.meta {
		margin: 6px 0 0;
		font-size: 12px;
		color: #94a3b8;
	}

	.error {
		margin: 8px 0 0;
		font-size: 12px;
		color: #f87171;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 20px;
	}

	.panel {
		background: #0f172a;
		border: 1px solid #1e293b;
		border-radius: 16px;
		padding: 20px;
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
	}

	.panel.full {
		width: 100%;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin-bottom: 12px;
	}

	label,
	.label {
		font-size: 12px;
		font-weight: 600;
		color: #cbd5f5;
	}

	input[type="text"],
	input[type="number"],
	input[type="file"] {
		background: #0b1328;
		border: 1px solid #1e293b;
		border-radius: 10px;
		padding: 10px 12px;
		color: #e2e8f0;
		font-size: 13px;
	}

	.row {
		display: flex;
		gap: 12px;
		align-items: center;
		flex-wrap: wrap;
	}

	.preset-row {
		align-items: center;
		margin-bottom: 12px;
	}

	.chip-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip {
		padding: 6px 10px;
		border-radius: 999px;
		background: #0b1328;
		border: 1px solid #1e293b;
		color: #cbd5f5;
		font-size: 12px;
		cursor: pointer;
	}

	.chip.active {
		background: #2563eb;
		border-color: #2563eb;
		color: white;
	}

	.actions,
	.token-actions {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.btn {
		border: 1px solid #334155;
		background: #0b1328;
		color: #e2e8f0;
		border-radius: 10px;
		padding: 8px 12px;
		font-size: 12px;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.btn.primary {
		background: #2563eb;
		border-color: #2563eb;
		color: white;
	}

	.btn.ghost {
		background: transparent;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	pre {
		background: #0b1328;
		border: 1px solid #1e293b;
		border-radius: 12px;
		padding: 12px;
		font-size: 12px;
		color: #e2e8f0;
		overflow: auto;
		max-height: 320px;
	}

	.token-panel {
		min-width: 260px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.gate {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		text-align: center;
		color: #0f172a;
		background: #f8fafc;
		padding: 32px;
	}

	.gate h1 {
		color: #0f172a;
	}

	.gate p {
		color: #475569;
	}

	@media (max-width: 640px) {
		.page {
			padding: 16px;
		}
	}
</style>
