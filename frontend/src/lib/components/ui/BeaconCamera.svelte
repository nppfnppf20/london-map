<script lang="ts">
	import { onMount } from 'svelte';
	import { getRandomTemplate } from '$utils/beacon-templates';

	interface Props {
		groupSize: number;
		onCapture: (blob: Blob) => void;
		onSkip: () => void;
	}

	let { groupSize, onCapture, onSkip }: Props = $props();

	let videoEl: HTMLVideoElement;
	let canvasEl: HTMLCanvasElement;
	let stream: MediaStream | null = null;
	let cameraReady = $state(false);
	let cameraError = $state('');
	let capturing = $state(false);

	const template = getRandomTemplate(groupSize);

	onMount(() => {
		startCamera();
		return () => stopCamera();
	});

	async function startCamera() {
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
			});
			videoEl.srcObject = stream;
			await videoEl.play();
			cameraReady = true;
		} catch {
			cameraError = 'Could not access camera. Please check permissions.';
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach(t => t.stop());
			stream = null;
		}
	}

	async function capture() {
		if (!videoEl || capturing) return;
		capturing = true;

		const width = videoEl.videoWidth || 640;
		const height = videoEl.videoHeight || 480;
		canvasEl.width = width;
		canvasEl.height = height;

		const ctx = canvasEl.getContext('2d')!;

		// Draw video frame (mirrored to match preview)
		ctx.save();
		ctx.translate(width, 0);
		ctx.scale(-1, 1);
		ctx.drawImage(videoEl, 0, 0, width, height);
		ctx.restore();

		// Draw template overlay
		try {
			const img = new Image();
			img.crossOrigin = 'anonymous';
			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () => reject(new Error('Failed to load template'));
				img.src = template.path;
			});
			ctx.drawImage(img, 0, 0, width, height);
		} catch {
			// Continue without template overlay if it fails to load
		}

		canvasEl.toBlob(
			(blob) => {
				if (blob) {
					onCapture(blob);
				}
				capturing = false;
			},
			'image/jpeg',
			0.85
		);
	}
</script>

<div class="beacon-camera">
	{#if cameraError}
		<div class="camera-error">
			<p>{cameraError}</p>
			<button class="btn-primary" onclick={onSkip}>Skip Photo</button>
		</div>
	{:else}
		<div class="camera-viewfinder">
			<!-- svelte-ignore a11y_media_has_caption -->
			<video
				bind:this={videoEl}
				autoplay
				playsinline
				muted
				class="camera-video"
			></video>
			{#if cameraReady}
				<img
					src={template.path}
					alt="{template.name} template"
					class="camera-overlay"
				/>
			{/if}
			{#if !cameraReady}
				<div class="camera-loading">Starting camera...</div>
			{/if}
		</div>

		<p class="template-label">{template.name} - {groupSize} {groupSize === 1 ? 'person' : 'people'}</p>

		<div class="camera-controls">
			<button class="btn-cancel" onclick={onSkip}>Skip</button>
			<button
				class="capture-btn"
				onclick={capture}
				disabled={!cameraReady || capturing}
				aria-label="Capture photo"
			>
				{#if capturing}
					<span class="capture-spinner"></span>
				{:else}
					<span class="capture-circle"></span>
				{/if}
			</button>
			<div style="width: 70px;"></div>
		</div>
	{/if}

	<canvas bind:this={canvasEl} class="camera-canvas"></canvas>
</div>

<style>
	.beacon-camera {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}

	.camera-viewfinder {
		position: relative;
		width: 100%;
		max-width: 400px;
		aspect-ratio: 4/3;
		border-radius: 12px;
		overflow: hidden;
		background: #000;
	}

	.camera-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform: scaleX(-1);
	}

	.camera-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		pointer-events: none;
	}

	.camera-loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #fff;
		font-size: 14px;
	}

	.camera-error {
		text-align: center;
		padding: 40px 20px;
		color: var(--color-text-secondary, #666);
	}

	.camera-error p {
		margin-bottom: 16px;
	}

	.template-label {
		font-size: 14px;
		color: var(--color-text-secondary, #888);
		text-align: center;
		margin: 0;
	}

	.camera-controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		max-width: 300px;
		padding: 8px 0;
	}

	.capture-btn {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		border: 3px solid var(--color-primary, #DAA520);
		background: transparent;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
	}

	.capture-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.capture-circle {
		display: block;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--color-primary, #DAA520);
	}

	.capture-spinner {
		display: block;
		width: 32px;
		height: 32px;
		border: 3px solid transparent;
		border-top-color: var(--color-primary, #DAA520);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.camera-canvas {
		display: none;
	}
</style>
