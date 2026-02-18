<script lang="ts">
	import { authStore } from '$stores/auth';
	import { profilesApi, likesApi } from '$services/api';
	import { goto } from '$app/navigation';
	import { CATEGORY_LABELS, CATEGORY_COLORS } from '$utils/map-helpers';
	import type { Profile, Place, Category } from '$types';

	let profile = $state<Profile | null>(null);
	let loading = $state(true);
	let error = $state('');
	let editing = $state(false);
	let editUsername = $state('');
	let saving = $state(false);

	let likedPlaces = $state<Place[]>([]);
	let likedLoading = $state(false);

	let likedByCategory = $derived(
		likedPlaces.reduce<Partial<Record<Category, Place[]>>>((acc, place) => {
			(acc[place.category] ??= []).push(place);
			return acc;
		}, {})
	);
	let likedCategories = $derived(Object.keys(likedByCategory) as Category[]);

	$effect(() => {
		if (!$authStore.loading && !$authStore.user) {
			goto('/');
		}
	});

	$effect(() => {
		if ($authStore.user) {
			loadProfile();
			loadLikedPlaces();
		}
	});

	async function loadLikedPlaces() {
		likedLoading = true;
		try {
			likedPlaces = await likesApi.getMyLikes();
		} catch {
			// silently fail — not critical
		} finally {
			likedLoading = false;
		}
	}

	async function loadProfile() {
		loading = true;
		error = '';
		try {
			profile = await profilesApi.getMe();
			editUsername = profile?.username || '';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load profile';
		} finally {
			loading = false;
		}
	}

	function startEditing() {
		editUsername = profile?.username || '';
		editing = true;
	}

	async function saveProfile() {
		saving = true;
		error = '';
		try {
			profile = await profilesApi.updateMe({ username: editUsername.trim() });
			editing = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update profile';
		} finally {
			saving = false;
		}
	}

	async function handleSignOut() {
		await authStore.signOut();
		goto('/');
	}
</script>

<div class="profile-page">
	<div class="profile-header">
		<a href="/" class="back-btn" aria-label="Back to map">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M15 18l-6-6 6-6"/>
			</svg>
		</a>
		<h1>Profile</h1>
	</div>

	{#if loading}
		<div class="profile-content">
			<p class="meta">Loading...</p>
		</div>
	{:else if profile}
		<div class="profile-content">
			<div class="avatar-section">
				<div class="avatar">
					{#if profile.avatar_url}
						<img src={profile.avatar_url} alt={profile.username} />
					{:else}
						<span class="avatar-letter">{profile.username[0]?.toUpperCase() || '?'}</span>
					{/if}
				</div>
			</div>

			<div class="info-section">
				{#if editing}
					<div class="edit-field">
						<label for="edit-username">Username</label>
						<div class="edit-row">
							<input
								id="edit-username"
								type="text"
								bind:value={editUsername}
								placeholder="Username"
							/>
							<button class="save-btn" onclick={saveProfile} disabled={saving || !editUsername.trim()}>
								{saving ? 'Saving...' : 'Save'}
							</button>
							<button class="cancel-btn" onclick={() => editing = false}>Cancel</button>
						</div>
					</div>
				{:else}
					<div class="info-row">
						<span class="info-label">Username</span>
						<span class="info-value">{profile.username}</span>
						<button class="edit-btn" onclick={startEditing}>Edit</button>
					</div>
				{/if}

				<div class="info-row">
					<span class="info-label">Email</span>
					<span class="info-value">{$authStore.user?.email}</span>
				</div>

				<div class="info-row">
					<span class="info-label">Role</span>
					<span class="info-value role-badge">{profile.role}</span>
				</div>

				<div class="info-row">
					<span class="info-label">Joined</span>
					<span class="info-value">{new Date(profile.created_at).toLocaleDateString()}</span>
				</div>
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<div class="liked-section">
				<h2 class="section-title">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
						<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
					</svg>
					Liked
				</h2>

				{#if likedLoading}
					<p class="liked-empty">Loading…</p>
				{:else if likedPlaces.length === 0}
					<p class="liked-empty">No liked places yet.</p>
				{:else}
					{#each likedCategories as category}
						<div class="liked-category">
							<div class="liked-category-header">
								<span class="liked-category-dot" style="background:{CATEGORY_COLORS[category]}"></span>
								<span class="liked-category-name">{CATEGORY_LABELS[category]}</span>
								<span class="liked-category-count">{likedByCategory[category]?.length}</span>
							</div>
							<div class="liked-category-places">
								{#each likedByCategory[category] ?? [] as place}
									<div class="liked-place">{place.name}</div>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="actions">
				{#if profile.role === 'admin'}
					<button class="admin-btn" onclick={() => goto('/admin')}>Admin</button>
				{/if}
				<button class="signout-btn" onclick={handleSignOut}>Sign Out</button>
			</div>
		</div>
	{:else}
		<div class="profile-content">
			<p class="error">{error || 'Could not load profile'}</p>
		</div>
	{/if}
</div>

<style>
	.profile-page {
		height: 100%;
		display: flex;
		flex-direction: column;
		background: #f9fafb;
		color: var(--color-primary);
	}

	.profile-header {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-lg);
		padding-top: calc(var(--spacing-lg) + env(safe-area-inset-top, 0px));
		background: white;
		border-bottom: 1px solid #e5e7eb;
	}

	.profile-header h1 {
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

	.profile-content {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-lg);
		-webkit-overflow-scrolling: touch;
	}

	.avatar-section {
		display: flex;
		justify-content: center;
	}

	.avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: var(--color-highlight);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-letter {
		font-size: 32px;
		font-weight: 700;
		color: white;
	}

	.info-section {
		background: white;
		border-radius: var(--radius-lg);
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.info-row {
		display: flex;
		align-items: center;
		padding: 14px 16px;
		border-bottom: 1px solid #f3f4f6;
	}

	.info-row:last-child {
		border-bottom: none;
	}

	.info-label {
		font-size: 13px;
		font-weight: 600;
		color: #6b7280;
		width: 80px;
		flex-shrink: 0;
	}

	.info-value {
		flex: 1;
		font-size: 15px;
		color: #111827;
	}

	.role-badge {
		text-transform: capitalize;
	}

	.edit-btn {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-highlight);
		background: none;
		padding: 4px 8px;
		-webkit-tap-highlight-color: transparent;
	}

	.edit-field {
		padding: 14px 16px;
	}

	.edit-field label {
		font-size: 13px;
		font-weight: 600;
		color: #6b7280;
		display: block;
		margin-bottom: 8px;
	}

	.edit-row {
		display: flex;
		gap: 8px;
	}

	.edit-row input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid #d1d5db;
		border-radius: var(--radius-md);
		font-size: 14px;
	}

	.save-btn {
		padding: 8px 14px;
		border-radius: var(--radius-md);
		background: var(--color-highlight);
		color: white;
		font-size: 13px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
	}

	.save-btn:disabled {
		opacity: 0.5;
	}

	.cancel-btn {
		padding: 8px 14px;
		border-radius: var(--radius-md);
		background: #f3f4f6;
		color: #374151;
		font-size: 13px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
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

	.liked-section {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.section-title {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
		color: #ef4444;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.liked-empty {
		font-size: 13px;
		color: #9ca3af;
		font-style: italic;
		margin: 0;
	}

	.liked-category {
		background: white;
		border-radius: var(--radius-lg);
		border: 1px solid #e5e7eb;
		overflow: hidden;
	}

	.liked-category-header {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-bottom: 1px solid #f3f4f6;
	}

	.liked-category-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.liked-category-name {
		flex: 1;
		font-size: 13px;
		font-weight: 700;
		color: #111827;
	}

	.liked-category-count {
		font-size: 12px;
		color: #9ca3af;
		font-weight: 600;
	}

	.liked-category-places {
		display: flex;
		flex-direction: column;
	}

	.liked-place {
		padding: 9px 14px;
		font-size: 14px;
		color: #374151;
		border-bottom: 1px solid #f9fafb;
	}

	.liked-place:last-child {
		border-bottom: none;
	}

	.actions {
		margin-top: auto;
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.admin-btn {
		width: 100%;
		padding: 14px;
		border-radius: var(--radius-md);
		background: var(--color-highlight);
		color: white;
		font-size: 15px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
		margin-bottom: 8px;
	}

	.admin-btn:active {
		opacity: 0.9;
	}

	.signout-btn {
		width: 100%;
		padding: 14px;
		border-radius: var(--radius-md);
		background: white;
		color: #dc2626;
		font-size: 15px;
		font-weight: 600;
		border: 1px solid #fecaca;
		-webkit-tap-highlight-color: transparent;
	}

	.signout-btn:active {
		background: #fef2f2;
	}
</style>
