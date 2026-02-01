<script lang="ts">
	import type { Place } from '$types';
	import { placesApi } from '$services/api';
	import { placesStore } from '$stores/places';

	interface Props {
		open: boolean;
		place: Place | null;
		onClose: () => void;
	}

	let { open, place, onClose }: Props = $props();

	let recording = $state(false);
	let uploading = $state(false);
	let error = $state('');
	let chunks: BlobPart[] = [];
	let recorder: MediaRecorder | null = null;
	let startedAt = 0;

	$effect(() => {
		if (!open) {
			reset();
		}
	});

	function reset() {
		recording = false;
		uploading = false;
		error = '';
		chunks = [];
		recorder?.stop();
		recorder = null;
		startedAt = 0;
	}

	async function startRecording() {
		if (!place) return;
		error = '';
		if (!navigator.mediaDevices?.getUserMedia) {
			error = 'Microphone access is not available.';
			return;
		}

		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		recorder = new MediaRecorder(stream);
		chunks = [];

		recorder.ondataavailable = event => {
			if (event.data.size > 0) {
				chunks.push(event.data);
			}
		};

		recorder.onstop = async () => {
			const durationSeconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : undefined;
			const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
			stream.getTracks().forEach(track => track.stop());

			if (!place) return;
			if (blob.size === 0) {
				error = 'No audio captured.';
				return;
			}

			try {
				uploading = true;
				const updated = await placesApi.uploadAudio(place.id, blob, durationSeconds);
				placesStore.updateLocal(place.id, updated);
				await placesStore.fetchAll();
				onClose();
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Failed to upload audio';
				error = message;
			} finally {
				uploading = false;
			}
		};

		recording = true;
		startedAt = Date.now();
		recorder.start();
	}

	function stopRecording() {
		if (!recorder) return;
		recording = false;
		recorder.stop();
	}
</script>

{#if open && place}
	<div class="backdrop">
		<div class="modal">
			<h3>Record audio for {place.name}</h3>
			<p class="hint">Speak naturally. We’ll transcribe and append it to the description.</p>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<div class="actions">
				{#if recording}
					<button class="btn-stop" onclick={stopRecording} disabled={uploading}>
						Stop recording
					</button>
				{:else}
					<button class="btn-start" onclick={startRecording} disabled={uploading}>
						Start recording
					</button>
				{/if}
				<button class="btn-cancel" onclick={onClose} disabled={uploading}>
					Cancel
				</button>
			</div>

			{#if uploading}
				<p class="status">Uploading and processing...</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 2200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
	}

	.modal {
		background: white;
		width: 100%;
		max-width: 420px;
		border-radius: var(--radius-lg);
		padding: var(--spacing-lg);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
	}

	h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
	}

	.hint {
		margin: 0;
		font-size: 13px;
		color: #6b7280;
	}

	.actions {
		display: flex;
		gap: var(--spacing-sm);
	}

	.btn-start,
	.btn-stop,
	.btn-cancel {
		flex: 1;
		padding: 12px 14px;
		border-radius: var(--radius-md);
		font-size: 14px;
		font-weight: 700;
		-webkit-tap-highlight-color: transparent;
	}

	.btn-start {
		background: var(--color-highlight);
		color: white;
	}

	.btn-stop {
		background: #111827;
		color: white;
	}

	.btn-cancel {
		background: #f3f4f6;
		color: #374151;
	}

	.status {
		margin: 0;
		font-size: 13px;
		color: #6b7280;
	}

	.error {
		margin: 0;
		font-size: 12px;
		color: #dc2626;
		background: #fef2f2;
		padding: var(--spacing-xs) var(--spacing-sm);
		border-radius: var(--radius-sm);
	}
</style>
