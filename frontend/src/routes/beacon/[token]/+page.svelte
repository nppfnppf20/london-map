<script lang="ts">
	import { page } from '$app/stores';
	import { beaconsApi } from '$services/api';
	import { CATEGORY_LABELS } from '$utils/map-helpers';
import type { Beacon, Category } from '$types';

	let beacon = $state<Beacon | null>(null);
	let error = $state('');
	let loading = $state(true);

	// Join form state
	let name = $state('');
	let joinError = $state('');
	let locating = $state(false);
	let joining = $state(false);
	let joined = $state(false);

	$effect(() => {
		const token = $page.params.token;
		if (token) {
			loadBeacon(token);
		}
	});

	async function loadBeacon(token: string) {
		loading = true;
		error = '';
		try {
			beacon = await beaconsApi.resolve(token);
		} catch {
			error = 'This beacon link is invalid or has expired.';
		}
		loading = false;
	}

	function useCurrentLocation() {
		if (!name.trim()) {
			joinError = 'Please enter your name first';
			return;
		}
		joinError = '';
		locating = true;

		if (!navigator.geolocation) {
			joinError = 'Geolocation is not supported by your browser';
			locating = false;
			return;
		}

		navigator.geolocation.getCurrentPosition(
			(position) => {
				locating = false;
				submitJoin(position.coords.latitude, position.coords.longitude);
			},
			() => {
				joinError = 'Could not get your location.';
				locating = false;
			},
			{ enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
		);
	}

	async function submitJoin(lat: number, lng: number) {
		if (!beacon) return;
		joining = true;
		joinError = '';

		try {
			beacon = await beaconsApi.join($page.params.token, {
				name: name.trim(),
				lat,
				lng
			});
			joined = true;
		} catch {
			joinError = 'Failed to join beacon. Please try again.';
		}

		joining = false;
	}

function categoryLabel(cat: Category): string {
	return CATEGORY_LABELS[cat] || cat;
}
</script>

<div class="beacon-page">
	{#if loading}
		<p class="meta">Loading beacon...</p>
	{:else if error}
		<div class="beacon-card">
			<h2>Beacon unavailable</h2>
			<p>{error}</p>
			<a href="/" class="home-link">Go to app</a>
		</div>
	{:else if beacon && joined}
		<div class="beacon-card">
			<h2>You've joined the beacon!</h2>
			<p>You've joined {beacon.creator_name}'s beacon. {beacon.participants.length + 1} people are in so far.</p>
			<p class="meta">Midpoint meeting spot suggestions coming soon...</p>
			<a href="/" class="home-link">Go to app</a>
		</div>
	{:else if beacon}
		<div class="beacon-card">
			<h2>The Beacons are Lit!</h2>
			<p>{beacon.creator_name} wants to find a {categoryLabel(beacon.category)} spot</p>

			<div class="join-form">
				<div class="join-field">
					<label for="join-name">Your name</label>
					<input
						id="join-name"
						type="text"
						bind:value={name}
						placeholder="Enter your name"
					/>
				</div>

				<button
					class="join-btn"
					onclick={useCurrentLocation}
					disabled={locating || joining}
				>
					{#if locating}Locating...
					{:else if joining}Joining...
					{:else}Share my location & join
					{/if}
				</button>

				{#if joinError}
					<p class="join-error">{joinError}</p>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.beacon-page {
		height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f9fafb;
		padding: 24px;
	}

	.meta {
		color: #6b7280;
		font-size: 15px;
	}

	.beacon-card {
		text-align: center;
		background: white;
		padding: 32px;
		border-radius: 16px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
		max-width: 360px;
		width: 100%;
	}

	.beacon-card h2 {
		margin: 0 0 8px;
		font-size: 18px;
		font-weight: 700;
		color: #0f172a;
	}

	.beacon-card p {
		margin: 0 0 20px;
		font-size: 14px;
		color: #6b7280;
	}

	.home-link {
		display: inline-block;
		padding: 10px 24px;
		background: var(--color-highlight, #e94560);
		color: white;
		border-radius: 8px;
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
	}

	.join-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 8px;
		text-align: left;
	}

	.join-field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.join-field label {
		font-size: 13px;
		font-weight: 600;
		color: #374151;
	}

	.join-field input {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 15px;
		font-family: inherit;
		color: #0f172a;
		background: white;
	}

	.join-field input:focus {
		outline: none;
		border-color: var(--color-highlight, #e94560);
		box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
	}

	.join-btn {
		padding: 12px;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		background: var(--color-highlight, #e94560);
		color: white;
		border: none;
		cursor: pointer;
	}

	.join-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.join-btn:active:not(:disabled) {
		opacity: 0.85;
	}

	.join-error {
		font-size: 13px;
		color: #dc2626;
		background: #fef2f2;
		padding: 8px 12px;
		border-radius: 4px;
		margin: 0;
		text-align: center;
	}
</style>
