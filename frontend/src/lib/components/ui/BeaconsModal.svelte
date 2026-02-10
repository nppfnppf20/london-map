<script lang="ts">
	import { beaconsApi } from '$services/api';
	import { CATEGORY_LABELS } from '$utils/map-helpers';
	import type { Category } from '$types';

	interface Props {
		open: boolean;
		onClose: () => void;
		onSelectOnMap: () => void;
		mapCoords?: [number, number] | null;
	}

	let { open, onClose, onSelectOnMap, mapCoords = null }: Props = $props();

	type Step = 'location' | 'category' | 'link';

	let step = $state<Step>('location');
	let coords = $state<[number, number] | null>(null);
	let selectedCategory = $state<Category | null>(null);
	let creatorName = $state('');
	let generatedUrl = $state('');
	let loading = $state(false);
	let error = $state('');
	let copied = $state(false);
	let locating = $state(false);

	const categories = (Object.entries(CATEGORY_LABELS) as [Category, string][]).map(
		([value, label]) => ({ value, label })
	);

	const canShare = typeof navigator !== 'undefined' && !!navigator.share;

	$effect(() => {
		if (mapCoords && open) {
			coords = mapCoords;
			step = 'category';
		}
	});

	function reset() {
		step = 'location';
		coords = null;
		selectedCategory = null;
		creatorName = '';
		generatedUrl = '';
		loading = false;
		error = '';
		copied = false;
		locating = false;
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

	function useCurrentLocation() {
		if (!creatorName.trim()) {
			error = 'Please enter your name first';
			return;
		}
		error = '';
		locating = true;

		if (!navigator.geolocation) {
			error = 'Geolocation is not supported by your browser';
			locating = false;
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				coords = [position.coords.latitude, position.coords.longitude];
				locating = false;
				step = 'category';
			},
			() => {
				error = 'Could not get your location. Try selecting on the map instead.';
				locating = false;
			},
			{ enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
		);
	}

	function selectOnMap() {
		if (!creatorName.trim()) {
			error = 'Please enter your name first';
			return;
		}
		error = '';
		onSelectOnMap();
	}

	async function generateLink() {
		if (!coords || !selectedCategory) return;

		loading = true;
		error = '';

		try {
			const beacon = await beaconsApi.create({
				creator_name: creatorName.trim(),
				creator_lat: coords[0],
				creator_lng: coords[1],
				category: selectedCategory
			});
			generatedUrl = `${window.location.origin}/beacon/${beacon.token}`;
			step = 'link';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create beacon';
		}

		loading = false;
	}

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(generatedUrl);
			copied = true;
			setTimeout(() => { copied = false; }, 2000);
		} catch {
			error = 'Failed to copy link';
		}
	}

	async function shareLink() {
		try {
			await navigator.share({
				title: 'The Beacons are Lit!',
				text: `${creatorName} has lit their beacon! Join me for ${CATEGORY_LABELS[selectedCategory!]}.`,
				url: generatedUrl
			});
		} catch {
			// User cancelled share - not an error
		}
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleBackdropClick}>
		<div class="modal-container" style="max-width: 440px;">
			<div class="modal-header">
				<h2>
					{#if step === 'location'}Where are you?
					{:else if step === 'category'}What are you after?
					{:else}Your beacon is lit! Share the link to let others know
					{/if}
				</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="modal-body">
				{#if step === 'location'}
					<div class="field">
						<label for="beacon-name">Your name</label>
						<input
							id="beacon-name"
							type="text"
							bind:value={creatorName}
							placeholder="Enter your name"
						/>
					</div>
					<div class="choice-grid">
						<button class="card-btn" onclick={useCurrentLocation} disabled={locating}>
							{locating ? 'Locating...' : 'Use current location'}
						</button>
						<button class="card-btn" onclick={selectOnMap}>
							Select on map
						</button>
					</div>

				{:else if step === 'category'}
					<div class="choice-grid">
						{#each categories as cat}
							<button
								class="card-btn"
								class:active={selectedCategory === cat.value}
								onclick={() => { selectedCategory = cat.value; }}
							>
								{cat.label}
							</button>
						{/each}
					</div>
					<div class="modal-actions">
						<button class="btn-cancel" onclick={() => { step = 'location'; }}>Back</button>
						<button
							class="btn-primary"
							disabled={!selectedCategory || loading}
							onclick={generateLink}
						>
							{loading ? 'Creating...' : 'Light the Beacon'}
						</button>
					</div>

				{:else}
					<p class="info-msg" style="text-align: center; word-break: break-all; font-size: 14px;">
						{generatedUrl}
					</p>
					<div class="modal-actions">
						<button class="btn-primary" onclick={copyLink}>
							{copied ? 'Copied!' : 'Copy Link'}
						</button>
					</div>
					{#if canShare}
						<div class="modal-actions">
							<button class="btn-cancel" onclick={shareLink}>Share</button>
						</div>
					{/if}
				{/if}

				{#if error}
					<p class="error-msg">{error}</p>
				{/if}
			</div>
		</div>
	</div>
{/if}
