<script lang="ts">
	import { beaconSessionStore, beaconBadgeCount } from '$stores/beaconSession';
	import { beaconStore } from '$stores/beacon';
	import { CATEGORY_LABELS } from '$utils/map-helpers';

	let state = $derived($beaconSessionStore);
	let sessions = $derived(state.sessions);
	let notifications = $derived(state.notifications);

	function getNotificationsForToken(token: string) {
		return notifications.filter(n => n.token === token);
	}

	async function viewMeetup(token: string) {
		await beaconStore.resolve(token);
	}

	function shareLink(token: string) {
		const url = `${window.location.origin}/beacon/${token}`;
		if (navigator.share) {
			navigator.share({ title: 'Join my beacon!', url }).catch(() => {});
		} else {
			navigator.clipboard.writeText(url).catch(() => {});
		}
	}

	function removeSession(token: string) {
		beaconSessionStore.removeSession(token);
	}

	// Clear notifications when viewing this tab
	$effect(() => {
		if (notifications.length > 0) {
			beaconSessionStore.clearNotifications();
		}
	});
</script>

<div class="beacon-home">
	{#if sessions.length === 0}
		<div class="beacon-empty">
			<span class="beacon-empty-icon">🔥</span>
			<p class="beacon-empty-title">No active beacons</p>
			<p class="beacon-empty-sub">Light a beacon or join one to see your sessions here.</p>
		</div>
	{:else}
		<div class="beacon-sessions">
			{#each sessions as session}
				{@const b = session.beacon}
				{@const tokenNotifs = getNotificationsForToken(session.token)}
				<div class="beacon-session-card ui-card">
					<div class="beacon-session-header">
						{#if b?.image_path}
							<img src={b.image_path} alt="Beacon photo" class="beacon-session-photo" />
						{/if}
						<div class="beacon-session-info">
							<p class="beacon-session-name">
								{b?.creator_name || 'Beacon'}
								{#if session.role === 'creator'}
									<span class="beacon-role-badge">Creator</span>
								{/if}
							</p>
							<p class="beacon-session-meta">
								{#if b?.categories?.length}
									{b.categories.map(c => CATEGORY_LABELS[c] || c).join(', ')}
								{/if}
								{#if b?.participants}
									&middot; {b.participants.length} joined
								{/if}
							</p>
						</div>
						<button
							class="beacon-session-remove"
							onclick={() => removeSession(session.token)}
							aria-label="Remove session"
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M18 6L6 18M6 6l12 12"/>
							</svg>
						</button>
					</div>

					{#if b?.participants && b.participants.length > 0}
						<div class="beacon-participants">
							{#each b.participants as p}
								<div class="beacon-participant">
									{#if p.image_path}
										<img src={p.image_path} alt={p.name} class="beacon-participant-photo" />
									{:else}
										<span class="beacon-participant-avatar">{p.name.charAt(0).toUpperCase()}</span>
									{/if}
									<span class="beacon-participant-name">{p.name}</span>
								</div>
							{/each}
						</div>
					{/if}

					{#if tokenNotifs.length > 0}
						<div class="beacon-notifs">
							{#each tokenNotifs as notif}
								<p class="beacon-notif">{notif.participantName} just joined!</p>
							{/each}
						</div>
					{/if}

					<div class="beacon-session-actions">
						<button
							class="btn-primary beacon-action-btn"
							onclick={() => viewMeetup(session.token)}
						>
							View meetup
						</button>
						{#if session.role === 'creator'}
							<button
								class="btn-cancel beacon-action-btn"
								onclick={() => shareLink(session.token)}
							>
								Share link
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.beacon-home {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
		overflow-y: auto;
	}

	.beacon-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 48px 24px;
		text-align: center;
	}

	.beacon-empty-icon {
		font-size: 40px;
		margin-bottom: 12px;
	}

	.beacon-empty-title {
		font-size: 16px;
		font-weight: 700;
		color: #374151;
		margin: 0 0 4px;
	}

	.beacon-empty-sub {
		font-size: 13px;
		color: #9ca3af;
		margin: 0;
	}

	.beacon-sessions {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.beacon-session-card {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.beacon-session-header {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.beacon-session-photo {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		object-fit: cover;
		flex-shrink: 0;
	}

	.beacon-session-info {
		flex: 1;
		min-width: 0;
	}

	.beacon-session-name {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
		color: #111827;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.beacon-role-badge {
		font-size: 10px;
		font-weight: 600;
		background: #fef3c7;
		color: #92400e;
		padding: 1px 6px;
		border-radius: 999px;
	}

	.beacon-session-meta {
		margin: 2px 0 0;
		font-size: 12px;
		color: #6b7280;
	}

	.beacon-session-remove {
		flex-shrink: 0;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: #f3f4f6;
		color: #9ca3af;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.beacon-session-remove:active {
		background: #e5e7eb;
	}

	.beacon-participants {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.beacon-participant {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.beacon-participant-photo {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		object-fit: cover;
	}

	.beacon-participant-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: #e5e7eb;
		color: #6b7280;
		font-size: 11px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.beacon-participant-name {
		font-size: 12px;
		color: #374151;
	}

	.beacon-notifs {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.beacon-notif {
		margin: 0;
		font-size: 12px;
		font-weight: 600;
		color: #059669;
		background: #ecfdf5;
		padding: 4px 8px;
		border-radius: 6px;
	}

	.beacon-session-actions {
		display: flex;
		gap: 8px;
	}

	.beacon-action-btn {
		flex: 1;
		font-size: 13px;
		padding: 8px 12px;
	}
</style>
