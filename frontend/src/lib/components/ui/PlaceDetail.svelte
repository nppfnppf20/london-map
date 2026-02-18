<script lang="ts">
	import type { Place, TravelProfile, Comment } from '$types';
	import { getCategoryColor, CATEGORY_LABELS } from '$utils/map-helpers';
	import { directionsStore, formatDuration, formatDistance, getGoogleMapsUrl } from '$stores/directions';
	import { commentsApi } from '$services/api';
	import { authStore } from '$stores/auth';
	import PlaceImageGallery from '$components/ui/PlaceImageGallery.svelte';

interface Props {
	place: Place | null;
	onClose: () => void;
	onAddTo: () => void;
}

let { place, onClose, onAddTo }: Props = $props();
let gettingLocation = $state(false);
let locationError = $state<string | null>(null);

let comments = $state<Comment[]>([]);
let commentsLoading = $state(false);
let newComment = $state('');
let submitting = $state(false);
let commentsError = $state<string | null>(null);
let commentsEl: HTMLDivElement | undefined;
let commentInputEl: HTMLTextAreaElement | undefined;

$effect(() => {
	if (place) {
		loadComments(place.id);
	} else {
		comments = [];
	}
});

async function loadComments(placeId: string) {
	commentsLoading = true;
	try {
		comments = await commentsApi.getForPlace(placeId);
	} catch {
		// silently fail — comments are non-critical
	} finally {
		commentsLoading = false;
	}
}

async function handleAddComment() {
	if (!place || !newComment.trim()) return;
	submitting = true;
	commentsError = null;
	try {
		const comment = await commentsApi.create(place.id, newComment.trim());
		comments = [...comments, comment];
		newComment = '';
	} catch (e) {
		commentsError = e instanceof Error ? e.message : 'Failed to post comment';
	} finally {
		submitting = false;
	}
}

async function handleDeleteComment(commentId: string) {
	try {
		await commentsApi.delete(commentId);
		comments = comments.filter(c => c.id !== commentId);
	} catch {
		// silently fail
	}
}

function scrollToComments() {
	commentsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	setTimeout(() => commentInputEl?.focus(), 300);
}

function formatRelativeTime(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	const hours = Math.floor(mins / 60);
	const days = Math.floor(hours / 24);
	if (mins < 1) return 'just now';
	if (mins < 60) return `${mins}m ago`;
	if (hours < 24) return `${hours}h ago`;
	if (days < 7) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

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

	async function handleGetDirections() {
		if (!place) return;

		gettingLocation = true;
		locationError = null;

		if (!navigator.geolocation) {
			locationError = 'Geolocation not supported';
			gettingLocation = false;
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				const origin = {
					lat: position.coords.latitude,
					lng: position.coords.longitude,
					name: 'Your location'
				};
				const destination = {
					lat: place!.latitude,
					lng: place!.longitude,
					name: place!.name
				};

				const success = await directionsStore.getDirections(origin, destination);
				gettingLocation = false;

				if (!success) {
					locationError = 'Failed to get directions';
				}
			},
			(error) => {
				gettingLocation = false;
				switch (error.code) {
					case error.PERMISSION_DENIED:
						locationError = 'Location permission denied';
						break;
					case error.POSITION_UNAVAILABLE:
						locationError = 'Location unavailable';
						break;
					case error.TIMEOUT:
						locationError = 'Location request timed out';
						break;
					default:
						locationError = 'Failed to get location';
				}
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}

	function handleOpenGoogleMaps() {
		if (!place || !$directionsStore.origin) return;

		const url = getGoogleMapsUrl(
			$directionsStore.origin,
			{ lat: place.latitude, lng: place.longitude },
			'walking'
		);
		window.open(url, '_blank');
	}

	function handleClearDirections() {
		directionsStore.clear();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if place}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={handleBackdropClick}>
		<div class="detail-panel">
			<div class="header">
				<div class="title-row">
					<span
						class="category-badge"
						style="background-color: {getCategoryColor(place.category)}"
					>
						{CATEGORY_LABELS[place.category] || place.category}
					</span>
					{#if place.priority === 'site'}
						<span class="priority-badge site">Site</span>
					{:else}
						<span class="priority-badge route">Route</span>
					{/if}
				</div>
				<h2>{place.name}</h2>
				{#if place.route || place.route_stop}
					<p class="route-name">
						{#if place.route}{place.route}{/if}
						{#if place.route_stop} · Stop {place.route_stop}{/if}
					</p>
				{/if}
				<div class="action-buttons">
					{#if !$directionsStore.active || $directionsStore.destination?.lat !== place.latitude}
						<button
							class="directions-btn"
							onclick={handleGetDirections}
							disabled={gettingLocation || $directionsStore.loading}
						>
							{#if gettingLocation || $directionsStore.loading}
								Getting directions…
							{:else}
								Get Directions
							{/if}
						</button>
					{:else}
						<button class="directions-btn clear" onclick={handleClearDirections}>
							Clear Route
						</button>
					{/if}
				</div>
				<div class="action-buttons secondary">
					<button class="add-to-btn" onclick={onAddTo}>Add to…</button>
					<button class="meta-btn" type="button" disabled>Like</button>
					<button class="meta-btn" type="button" onclick={scrollToComments}>Comment</button>
				</div>
				{#if locationError}
					<p class="error-text">{locationError}</p>
				{/if}
				{#if $directionsStore.active && $directionsStore.result && $directionsStore.destination?.lat === place.latitude}
					<div class="directions-info">
						<div class="directions-stats">
							<span class="stat">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"/>
									<path d="M12 6v6l4 2"/>
								</svg>
								{formatDuration($directionsStore.result.duration)}
							</span>
							<span class="stat">
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
									<circle cx="12" cy="10" r="3"/>
								</svg>
								{formatDistance($directionsStore.result.distance)}
							</span>
						</div>
						<button class="google-maps-btn" onclick={handleOpenGoogleMaps}>
							Open in Google Maps
						</button>
					</div>
				{/if}
				<button class="close-btn" onclick={onClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="content">
				<PlaceImageGallery audioPath={place.audio_path} images={place.images || []} placeId={place.id} />
				{#if place.description}
					<div class="description">
						{#each place.description.split('\n\n') as paragraph}
							<p>{paragraph}</p>
						{/each}
					</div>
				{:else}
					<p class="no-description">No description available.</p>
				{/if}

				<div class="comments" bind:this={commentsEl}>
					<div class="comments-header">
						<span class="comments-title">Comments{comments.length > 0 ? ` (${comments.length})` : ''}</span>
					</div>

					{#if commentsLoading}
						<div class="comments-placeholder">Loading…</div>
					{:else if comments.length === 0}
						<div class="comments-placeholder">No comments yet.</div>
					{:else}
						<div class="comments-list">
							{#each comments as comment (comment.id)}
								<div class="comment">
									<div class="comment-avatar">
										{comment.author?.username?.[0]?.toUpperCase() ?? '?'}
									</div>
									<div class="comment-body">
										<div class="comment-meta">
											<span class="comment-author">{comment.author?.username ?? 'Anonymous'}</span>
											<span class="comment-time">{formatRelativeTime(comment.created_at)}</span>
										</div>
										<p class="comment-text">{comment.body}</p>
									</div>
									{#if $authStore.user?.id === comment.user_id || $authStore.user?.role === 'admin'}
										<button
											class="comment-delete"
											onclick={() => handleDeleteComment(comment.id)}
											aria-label="Delete comment"
										>×</button>
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					{#if $authStore.user}
						<div class="comment-input-row">
							<textarea
								bind:value={newComment}
								bind:this={commentInputEl}
								placeholder="Add a comment…"
								rows={2}
								disabled={submitting}
							></textarea>
							<button
								class="comment-submit"
								onclick={handleAddComment}
								disabled={submitting || !newComment.trim()}
							>{submitting ? '…' : 'Post'}</button>
						</div>
						{#if commentsError}
							<p class="comments-error">{commentsError}</p>
						{/if}
					{:else}
						<p class="comments-signin">Sign in to leave a comment.</p>
					{/if}
				</div>
			</div>

			{#if place.tags && place.tags.length > 0}
				<div class="tags">
					{#each place.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			{/if}
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

	.detail-panel {
		background: white;
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		color: var(--color-primary);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.header {
		position: relative;
		padding: var(--spacing-lg);
		border-bottom: 1px solid #e5e7eb;
	}

	.title-row {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.category-badge {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		color: white;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.priority-badge {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		padding: 2px 8px;
		border-radius: 4px;
	}

	.priority-badge.site {
		background: var(--color-highlight);
		color: white;
	}

	.priority-badge.route {
		background: #e5e7eb;
		color: #6b7280;
	}

	h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		line-height: 1.3;
		padding-right: 40px;
	}

	.route-name {
		margin: var(--spacing-xs) 0 0 0;
		font-size: 13px;
		color: #6b7280;
	}

	.action-buttons {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--spacing-sm);
		margin-top: var(--spacing-md);
	}

	.action-buttons.secondary {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		margin-top: var(--spacing-sm);
	}

	.add-to-btn {
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: #111827;
		color: white;
		font-size: 12px;
		font-weight: 600;
		width: 100%;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		-webkit-tap-highlight-color: transparent;
	}

	.directions-btn {
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: #3b82f6;
		color: white;
		font-size: 12px;
		font-weight: 600;
		width: 100%;
		-webkit-tap-highlight-color: transparent;
	}

	.directions-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.directions-btn.clear {
		background: #6b7280;
	}

	.meta-btn {
		padding: 8px 10px;
		border-radius: var(--radius-md);
		background: #f3f4f6;
		color: #374151;
		font-size: 12px;
		font-weight: 600;
		width: 100%;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		-webkit-tap-highlight-color: transparent;
	}

	.meta-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error-text {
		margin: var(--spacing-sm) 0 0 0;
		font-size: 12px;
		color: #ef4444;
	}

	.directions-info {
		margin-top: var(--spacing-md);
		padding: var(--spacing-md);
		background: #f0f9ff;
		border-radius: var(--radius-md);
		border: 1px solid #bae6fd;
	}

	.directions-stats {
		display: flex;
		gap: var(--spacing-lg);
		margin-bottom: var(--spacing-sm);
	}

	.stat {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		font-size: 14px;
		font-weight: 600;
		color: #0369a1;
	}

	.stat svg {
		color: #0ea5e9;
	}

	.google-maps-btn {
		margin-top: var(--spacing-sm);
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		background: white;
		color: #0369a1;
		font-size: 12px;
		font-weight: 600;
		border: 1px solid #7dd3fc;
		-webkit-tap-highlight-color: transparent;
	}

	.google-maps-btn:active {
		background: #e0f2fe;
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
		-webkit-overflow-scrolling: touch;
	}

	.description p {
		margin: 0 0 var(--spacing-md) 0;
		font-size: 15px;
		line-height: 1.6;
		color: #374151;
	}

	.description p:last-child {
		margin-bottom: 0;
	}

	.no-description {
		color: #9ca3af;
		font-style: italic;
	}

	.comments {
		margin-top: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.comments-header {
		display: flex;
		align-items: baseline;
	}

	.comments-title {
		font-size: 14px;
		font-weight: 700;
		color: #111827;
	}

	.comments-placeholder {
		padding: 10px 12px;
		border-radius: var(--radius-md);
		border: 1px solid #e5e7eb;
		background: #f9fafb;
		color: #9ca3af;
		font-size: 13px;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.comment {
		display: flex;
		gap: var(--spacing-sm);
		align-items: flex-start;
	}

	.comment-avatar {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #e5e7eb;
		color: #374151;
		font-size: 12px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.comment-body {
		flex: 1;
		min-width: 0;
	}

	.comment-meta {
		display: flex;
		gap: var(--spacing-sm);
		align-items: baseline;
		margin-bottom: 2px;
	}

	.comment-author {
		font-size: 12px;
		font-weight: 600;
		color: #111827;
	}

	.comment-time {
		font-size: 11px;
		color: #9ca3af;
	}

	.comment-text {
		margin: 0;
		font-size: 13px;
		line-height: 1.5;
		color: #374151;
		word-break: break-word;
	}

	.comment-delete {
		flex-shrink: 0;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: transparent;
		color: #9ca3af;
		font-size: 16px;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.comment-delete:hover {
		background: #fee2e2;
		color: #ef4444;
	}

	.comment-input-row {
		display: flex;
		gap: var(--spacing-sm);
		align-items: flex-end;
		margin-top: var(--spacing-xs);
	}

	.comment-input-row textarea {
		flex: 1;
		padding: 8px 10px;
		border: 1px solid #e5e7eb;
		border-radius: var(--radius-md);
		font-size: 13px;
		font-family: inherit;
		resize: none;
		color: #111827;
		background: #fff;
	}

	.comment-input-row textarea:focus {
		outline: none;
		border-color: #3b82f6;
	}

	.comment-input-row textarea:disabled {
		opacity: 0.6;
	}

	.comment-submit {
		flex-shrink: 0;
		padding: 8px 14px;
		border-radius: var(--radius-md);
		background: #111827;
		color: white;
		font-size: 12px;
		font-weight: 600;
		-webkit-tap-highlight-color: transparent;
	}

	.comment-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.comments-error {
		margin: 0;
		font-size: 12px;
		color: #ef4444;
	}

	.comments-signin {
		margin: 0;
		font-size: 12px;
		color: #9ca3af;
		font-style: italic;
	}

	.tags {
		padding: var(--spacing-md) var(--spacing-lg);
		border-top: 1px solid #e5e7eb;
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.tag {
		font-size: 12px;
		background: #f3f4f6;
		color: #6b7280;
		padding: 4px 10px;
		border-radius: 12px;
	}
</style>
