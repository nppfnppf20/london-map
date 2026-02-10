<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { beaconStore } from '$stores/beacon';

	let error = $state('');
	let loading = $state(true);

	$effect(() => {
		const token = $page.params.token;
		if (token) {
			loadAndRedirect(token);
		}
	});

	async function loadAndRedirect(token: string) {
		loading = true;
		error = '';

		const beacon = await beaconStore.load(token);

		if (!beacon) {
			loading = false;
			error = 'This beacon link is invalid or has expired.';
			return;
		}

		goto('/');
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
</style>
