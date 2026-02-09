<script lang="ts">
	import { tick } from 'svelte';

	interface Props {
		audioPath?: string | null;
	}

	let { audioPath = null }: Props = $props();

	type PlaceholderImage = {
		id: string;
		label: string;
	};

	const images: PlaceholderImage[] = [
		{ id: 'img-1', label: 'Front view' },
		{ id: 'img-2', label: 'Interior' },
		{ id: 'img-3', label: 'Details' },
		{ id: 'img-4', label: 'Street view' }
	];

	let viewerOpen = $state(false);
	let activeIndex = $state(0);
	let trackEl: HTMLDivElement | null = null;

	let audioEl: HTMLAudioElement | null = null;
	let isPlaying = $state(false);

	function toggleAudio() {
		if (!audioPath) return;

		if (!audioEl) {
			audioEl = new Audio(audioPath);
			audioEl.addEventListener('ended', () => {
				isPlaying = false;
			});
		}

		if (isPlaying) {
			audioEl.pause();
			isPlaying = false;
		} else {
			audioEl.play();
			isPlaying = true;
		}
	}

	$effect(() => {
		return () => {
			if (audioEl) {
				audioEl.pause();
				audioEl = null;
			}
		};
	});

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
		if (activeIndex < images.length - 1) {
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
	<div class="gallery-header">
		<span class="gallery-title">Photos</span>
		<span class="gallery-subtitle">Tap to view</span>
	</div>
	{#if audioPath}
		<div class="audio-row">
			<button class="audio-play" class:playing={isPlaying} type="button" aria-label={isPlaying ? 'Pause audio' : 'Play audio'} onclick={toggleAudio}>
				<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					{#if isPlaying}
						<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
					{:else}
						<path d="M8 5v14l11-7z"/>
					{/if}
				</svg>
			</button>
			<span class="audio-label">{isPlaying ? 'Playing…' : 'Play audio'}</span>
		</div>
	{/if}
	<div class="thumbnails">
		{#each images as image, index}
			<button class="thumb" type="button" onclick={() => openViewer(index)}>
				<span class="thumb-label">{image.label}</span>
			</button>
		{/each}
	</div>
</div>

{#if viewerOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="viewer-backdrop" onclick={handleBackdropClick}>
		<div class="viewer">
			<div class="viewer-track" bind:this={trackEl}>
				{#each images as image}
					<div class="viewer-slide">
						<div class="viewer-image">
							<span>{image.label}</span>
						</div>
					</div>
				{/each}
			</div>
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
			<button class="viewer-nav next" type="button" onclick={goNext} disabled={activeIndex === images.length - 1} aria-label="Next photo">
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

	.audio-row {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #6b7280;
		font-size: 12px;
	}

	.audio-play {
		width: 26px;
		height: 26px;
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

	.audio-label {
		font-weight: 600;
	}

	.audio-contributor {
		color: #9ca3af;
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
		background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
		display: flex;
		align-items: flex-end;
		justify-content: flex-start;
		padding: 8px;
		color: #374151;
		font-size: 11px;
		font-weight: 600;
		text-align: left;
		-webkit-tap-highlight-color: transparent;
	}

	.thumb-label {
		background: rgba(255, 255, 255, 0.8);
		padding: 2px 6px;
		border-radius: 999px;
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
		aspect-ratio: 16 / 10;
		border-radius: var(--radius-lg);
		background: linear-gradient(135deg, #e5e7eb, #cbd5f5);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #374151;
		font-weight: 600;
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
