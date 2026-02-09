<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { shareStore } from '$stores/share';
	import { placesStore } from '$stores/places';
	import { collectionsStore } from '$stores/collections';

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

		const data = await shareStore.resolve(token);

		if (!data) {
			loading = false;
			error = 'This share link is invalid or has been revoked.';
			return;
		}

		// Pre-load shared places and collections into the app stores
		if (data.places.length) {
			placesStore.upsertMany(data.places);
		}

		// Navigate to main app
		goto('/');
	}
</script>

<div class="share-loading">
	{#if loading}
		<p class="meta">Loading shared content...</p>
	{:else if error}
		<div class="error-card">
			<h2>Link unavailable</h2>
			<p>{error}</p>
			<a href="/" class="home-link">Go to app</a>
		</div>
	{/if}
</div>

<style>
	.share-loading {
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

	.error-card {
		text-align: center;
		background: white;
		padding: 32px;
		border-radius: 16px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
		max-width: 360px;
	}

	.error-card h2 {
		margin: 0 0 8px;
		font-size: 18px;
		font-weight: 700;
		color: #0f172a;
	}

	.error-card p {
		margin: 0 0 20px;
		font-size: 14px;
		color: #6b7280;
	}

	.home-link {
		display: inline-block;
		padding: 10px 24px;
		background: var(--color-highlight, #6366f1);
		color: white;
		border-radius: 8px;
		text-decoration: none;
		font-size: 14px;
		font-weight: 600;
	}
</style>
