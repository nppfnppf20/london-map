<script lang="ts">
	import { tick } from 'svelte';
	import type { PlaceImage } from '$types';
	import { placeImagesApi } from '$services/api';

	interface Props {
		audioPath?: string | null;
		images?: PlaceImage[];
		placeId?: string | null;
	}

	let { audioPath = null, images = [], placeId = null }: Props = $props();

	let extraImages = $state<PlaceImage[]>([]);
	let allImages = $derived([...images, ...extraImages]);
	let fileInput: HTMLInputElement | null = null;
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);

	let viewerOpen = $state(false);
	let activeIndex = $state(0);
	let trackEl: HTMLDivElement | null = null;

	let audioEl: HTMLAudioElement | null = null;
	let isPlaying = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let seeking = $state(false);
	let progressBarEl: HTMLDivElement | null = null;

	function formatTime(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function ensureAudio() {
		if (audioEl || !audioPath) return;
		audioEl = new Audio(audioPath);
		audioEl.addEventListener('ended', () => {
			isPlaying = false;
			currentTime = 0;
		});
		audioEl.addEventListener('loadedmetadata', () => {
			duration = audioEl!.duration;
		});
		audioEl.addEventListener('timeupdate', () => {
			if (!seeking) {
				currentTime = audioEl!.currentTime;
			}
		});
	}

	function toggleAudio() {
		if (!audioPath) return;
		ensureAudio();

		if (isPlaying) {
			audioEl!.pause();
			isPlaying = false;
		} else {
			audioEl!.play();
			isPlaying = true;
		}
	}

	function seekFromEvent(e: MouseEvent | Touch) {
		if (!progressBarEl || !audioEl || !duration) return;
		const rect = progressBarEl.getBoundingClientRect();
		const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
		audioEl.currentTime = ratio * duration;
		currentTime = audioEl.currentTime;
	}

	function onBarPointerDown(e: PointerEvent) {
		if (!audioEl || !duration) return;
		seeking = true;
		seekFromEvent(e);
		const onMove = (ev: PointerEvent) => seekFromEvent(ev);
		const onUp = () => {
			seeking = false;
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		};
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	$effect(() => {
		return () => {
			if (audioEl) {
				audioEl.pause();
				audioEl = null;
			}
		};
	});

	function triggerUpload() {
		fileInput?.click();
	}

	async function handleFileSelected(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !placeId) return;

		uploading = true;
		uploadError = null;
		try {
			const newImage = await placeImagesApi.upload(placeId, file);
			extraImages = [...extraImages, newImage];
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload failed';
			console.error('Failed to upload image:', err);
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	function openViewer(index: number) {
		activeIndex = index;
		viewerOpen = true;
	}

	function closeViewer() {
		viewerOpen = false;
	}

	async function scrollToActive() {
		if (!trackEl) return;
		await tick();
		const width = trackEl.clientWidth;
		trackEl.scrollTo({ left: width * activeIndex, behavior: 'smooth' });
	}

	function goPrev() {
		if (activeIndex > 0) {
			activeIndex -= 1;
		}
	}

	function goNext() {
		if (activeIndex < allImages.length - 1) {
			activeIndex += 1;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeViewer();
		}
	}

	$effect(() => {
		if (viewerOpen) {
			scrollToActive();
		}
	});
</script>

<div class="gallery">
	{#if audioPath}
		<div class="audio-player">
			<button class="audio-play" class:playing={isPlaying} type="button" aria-label={isPlaying ? 'Pause audio' : 'Play audio'} onclick={toggleAudio}>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					{#if isPlaying}
						<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
					{:else}
						<path d="M8 5v14l11-7z"/>
					{/if}
				</svg>
			</button>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="audio-bar" bind:this={progressBarEl} onpointerdown={onBarPointerDown}>
				<div class="audio-bar-fill" style="width: {duration ? (currentTime / duration) * 100 : 0}%">
					<div class="audio-bar-thumb"></div>
				</div>
			</div>
			<span class="audio-time">{formatTime(currentTime)}{#if duration} / {formatTime(duration)}{/if}</span>
		</div>
	{/if}
	{#if allImages.length > 0 || placeId}
		<div class="gallery-header">
			<span class="gallery-title">Photos</span>
			<span class="gallery-subtitle">{allImages.length > 0 ? 'Tap to view' : ''}</span>
		</div>
		<div class="thumbnails">
			{#each allImages as image, index}
				<button class="thumb" type="button" onclick={() => openViewer(index)}>
					<img src={image.image_path} alt={image.caption || ''} class="thumb-img" />
					{#if image.caption}
						<span class="thumb-label">{image.caption}</span>
					{/if}
				</button>
			{/each}
			{#if placeId}
				<button class="thumb add-thumb" type="button" onclick={triggerUpload} disabled={uploading}>
					{#if uploading}
						<span class="add-icon uploading">…</span>
					{:else}
						<svg class="add-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 5v14M5 12h14"/>
						</svg>
					{/if}
				</button>
				<input
					bind:this={fileInput}
					type="file"
					accept="image/*"
					class="file-input-hidden"
					onchange={handleFileSelected}
				/>
			{/if}
		</div>
		{#if uploadError}
			<p class="upload-error">{uploadError}</p>
		{/if}
	{/if}
</div>

{#if viewerOpen && allImages.length > 0}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="viewer-backdrop" onclick={handleBackdropClick}>
		<div class="viewer">
			<div class="viewer-track" bind:this={trackEl}>
				{#each allImages as image}
					<div class="viewer-slide">
						<img src={image.image_path} alt={image.caption || ''} class="viewer-image" />
					</div>
				{/each}
			</div>
			{#if allImages[activeIndex]?.caption}
				<div class="viewer-caption">{allImages[activeIndex].caption}</div>
			{/if}
			<button class="viewer-close" type="button" onclick={closeViewer} aria-label="Close photos">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12"/>
				</svg>
			</button>
			<button class="viewer-nav prev" type="button" onclick={goPrev} disabled={activeIndex === 0} aria-label="Previous photo">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
			</button>
			<button class="viewer-nav next" type="button" onclick={goNext} disabled={activeIndex === allImages.length - 1} aria-label="Next photo">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M9 18l6-6-6-6"/>
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	.gallery {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.gallery-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.gallery-title {
		font-size: 14px;
		font-weight: 700;
		color: #111827;
	}

	.gallery-subtitle {
		font-size: 12px;
		color: #9ca3af;
	}

	.audio-player {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.audio-play {
		width: 28px;
		height: 28px;
		min-width: 28px;
		border-radius: 999px;
		background: #dbeafe;
		color: #1d4ed8;
		border: 1px solid #bfdbfe;
		display: flex;
		align-items: center;
		justify-content: center;
		-webkit-tap-highlight-color: transparent;
	}

	.audio-play.playing {
		background: #1d4ed8;
		color: white;
		border-color: #1d4ed8;
	}

	.audio-bar {
		flex: 1;
		height: 6px;
		background: #e5e7eb;
		border-radius: 999px;
		position: relative;
		cursor: pointer;
		touch-action: none;
	}

	.audio-bar-fill {
		height: 100%;
		background: #3b82f6;
		border-radius: 999px;
		position: relative;
		min-width: 0;
		max-width: 100%;
	}

	.audio-bar-thumb {
		position: absolute;
		right: -5px;
		top: 50%;
		transform: translateY(-50%);
		width: 12px;
		height: 12px;
		border-radius: 999px;
		background: #1d4ed8;
		border: 2px solid white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	.audio-time {
		font-size: 11px;
		color: #6b7280;
		white-space: nowrap;
		min-width: 70px;
		text-align: right;
	}

	.thumbnails {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--spacing-sm);
	}

	.thumb {
		aspect-ratio: 1 / 1;
		border-radius: var(--radius-md);
		border: 1px solid #e5e7eb;
		overflow: hidden;
		display: flex;
		align-items: flex-end;
		justify-content: flex-start;
		padding: 0;
		position: relative;
		-webkit-tap-highlight-color: transparent;
	}

	.thumb-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.add-thumb {
		background: #f9fafb;
		border: 2px dashed #d1d5db;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.add-thumb:active {
		background: #f3f4f6;
		border-color: #9ca3af;
	}

	.add-thumb:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.add-icon {
		color: #9ca3af;
	}

	.add-icon.uploading {
		font-size: 18px;
		color: #6b7280;
	}

	.upload-error {
		margin: var(--spacing-xs) 0 0 0;
		font-size: 12px;
		color: #ef4444;
	}

	.file-input-hidden {
		position: absolute;
		width: 0;
		height: 0;
		overflow: hidden;
		opacity: 0;
		pointer-events: none;
	}

	.thumb-label {
		position: relative;
		z-index: 1;
		background: rgba(255, 255, 255, 0.8);
		padding: 2px 6px;
		border-radius: 999px;
		margin: 6px;
		font-size: 11px;
		font-weight: 600;
		color: #374151;
	}

	.viewer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 23, 42, 0.65);
		z-index: 2200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--spacing-md);
	}

	.viewer {
		width: min(720px, 100%);
		max-height: 80vh;
		background: white;
		border-radius: var(--radius-lg);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
	}

	.viewer-track {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 100%;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.viewer-track::-webkit-scrollbar {
		display: none;
	}

	.viewer-slide {
		scroll-snap-align: center;
		padding: var(--spacing-lg);
	}

	.viewer-image {
		width: 100%;
		aspect-ratio: 16 / 10;
		border-radius: var(--radius-lg);
		object-fit: cover;
	}

	.viewer-caption {
		padding: 0 var(--spacing-lg) var(--spacing-md);
		font-size: 13px;
		color: #374151;
		text-align: center;
	}

	.viewer-nav {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		z-index: 2;
		width: 40px;
		height: 40px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid #e5e7eb;
		color: #111827;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15);
		-webkit-tap-highlight-color: transparent;
	}

	.viewer-nav:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.viewer-nav.prev {
		left: var(--spacing-md);
	}

	.viewer-nav.next {
		right: var(--spacing-md);
	}

	.viewer-close {
		position: absolute;
		top: var(--spacing-md);
		right: var(--spacing-md);
		z-index: 3;
		width: 28px;
		height: 28px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid #e5e7eb;
		color: #111827;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15);
		-webkit-tap-highlight-color: transparent;
	}

	@media (hover: none) and (pointer: coarse) {
		.viewer-nav {
			display: none;
		}
	}
</style>
