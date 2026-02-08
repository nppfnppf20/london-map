<script lang="ts">
	import { authStore } from '$stores/auth';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let mode = $state<'signin' | 'signup'>('signin');
	let email = $state('');
	let password = $state('');
	let username = $state('');
	let loading = $state(false);
	let error = $state('');

	function reset() {
		email = '';
		password = '';
		username = '';
		error = '';
		loading = false;
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

	function switchMode(newMode: 'signin' | 'signup') {
		mode = newMode;
		error = '';
	}

	async function handleSubmit() {
		if (!email.trim() || !password) {
			error = 'Email and password are required';
			return;
		}

		if (mode === 'signup' && !username.trim()) {
			error = 'Username is required';
			return;
		}

		loading = true;
		error = '';

		try {
			if (mode === 'signup') {
				await authStore.signUp(email.trim(), password, username.trim());
			} else {
				await authStore.signIn(email.trim(), password);
			}
			handleClose();
		} catch (err: any) {
			error = err.message || 'Authentication failed';
		} finally {
			loading = false;
		}
	}

	async function handleGoogle() {
		loading = true;
		error = '';

		try {
			await authStore.signInWithGoogle();
		} catch (err: any) {
			error = err.message || 'Google sign-in failed';
			loading = false;
		}
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="backdrop" onclick={handleBackdropClick}>
		<div class="modal">
			<div class="header">
				<h2>{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Close">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M18 6L6 18M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<div class="tabs">
				<button
					class="tab"
					class:active={mode === 'signin'}
					onclick={() => switchMode('signin')}
				>
					Sign In
				</button>
				<button
					class="tab"
					class:active={mode === 'signup'}
					onclick={() => switchMode('signup')}
				>
					Sign Up
				</button>
			</div>

			<form class="form" onsubmit={e => { e.preventDefault(); handleSubmit(); }}>
				{#if mode === 'signup'}
					<div class="field">
						<label for="auth-username">Username</label>
						<input
							id="auth-username"
							type="text"
							bind:value={username}
							placeholder="Choose a username"
							autocomplete="username"
						/>
					</div>
				{/if}

				<div class="field">
					<label for="auth-email">Email</label>
					<input
						id="auth-email"
						type="email"
						bind:value={email}
						placeholder="you@example.com"
						autocomplete="email"
					/>
				</div>

				<div class="field">
					<label for="auth-password">Password</label>
					<input
						id="auth-password"
						type="password"
						bind:value={password}
						placeholder={mode === 'signup' ? 'Choose a password (6+ chars)' : 'Your password'}
						autocomplete={mode === 'signup' ? 'new-password' : 'current-password'}
					/>
				</div>

				{#if error}
					<p class="error">{error}</p>
				{/if}

				<button type="submit" class="btn-submit" disabled={loading}>
					{#if loading}
						{mode === 'signin' ? 'Signing in...' : 'Creating account...'}
					{:else}
						{mode === 'signin' ? 'Sign In' : 'Create Account'}
					{/if}
				</button>
			</form>
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

	.modal {
		background: white;
		width: 100%;
		max-width: 400px;
		max-height: 85vh;
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		color: var(--color-primary);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		overflow: hidden;
	}

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-lg);
		border-bottom: 1px solid #e5e7eb;
	}

	.header h2 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
	}

	.close-btn {
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

	.tabs {
		display: flex;
		border-bottom: 1px solid #e5e7eb;
	}

	.tab {
		flex: 1;
		padding: 12px;
		font-size: 14px;
		font-weight: 600;
		color: #6b7280;
		background: none;
		border-bottom: 2px solid transparent;
		-webkit-tap-highlight-color: transparent;
		transition: color 0.15s, border-color 0.15s;
	}

	.tab.active {
		color: var(--color-highlight);
		border-bottom-color: var(--color-highlight);
	}

	.form {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-lg);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		-webkit-overflow-scrolling: touch;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.field label {
		font-size: 13px;
		font-weight: 600;
		color: #374151;
	}

	.field input {
		padding: 10px 12px;
		border: 1px solid #d1d5db;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-family: inherit;
		color: var(--color-primary);
		background: white;
		-webkit-appearance: none;
	}

	.field input:focus {
		outline: none;
		border-color: var(--color-highlight);
		box-shadow: 0 0 0 3px rgba(233, 69, 96, 0.1);
	}

	.error {
		font-size: 13px;
		color: #dc2626;
		background: #fef2f2;
		padding: var(--spacing-sm) var(--spacing-md);
		border-radius: var(--radius-sm);
		margin: 0;
	}

	.btn-submit {
		padding: 12px;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-weight: 600;
		background: var(--color-highlight);
		color: white;
		-webkit-tap-highlight-color: transparent;
	}

	.btn-submit:active:not(:disabled) {
		opacity: 0.85;
	}

	.btn-submit:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.divider {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
	}

	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		height: 1px;
		background: #e5e7eb;
	}

	.divider span {
		font-size: 12px;
		color: #9ca3af;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.btn-google {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		padding: 12px;
		border-radius: var(--radius-md);
		font-size: 15px;
		font-weight: 600;
		background: white;
		color: #374151;
		border: 1px solid #d1d5db;
		-webkit-tap-highlight-color: transparent;
	}

	.btn-google:active:not(:disabled) {
		background: #f9fafb;
	}

	.btn-google:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
