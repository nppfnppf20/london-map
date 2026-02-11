<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		name: string;
		imagePath: string | null;
		onDone: () => void;
	}

	let { name, imagePath, onDone }: Props = $props();

	let visible = $state(true);

	// Generate particle bursts
	const PARTICLE_COUNT = 40;
	const COLORS = ['#f59e0b', '#ef4444', '#f97316', '#fbbf24', '#fcd34d', '#ffffff', '#fb923c'];

	interface Particle {
		id: number;
		x: number;
		y: number;
		color: string;
		size: number;
		tx: number;
		ty: number;
		delay: number;
		duration: number;
	}

	const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
		const angle = Math.random() * Math.PI * 2;
		const distance = 80 + Math.random() * 200;
		return {
			id: i,
			x: 30 + Math.random() * 40,
			y: 20 + Math.random() * 40,
			color: COLORS[Math.floor(Math.random() * COLORS.length)],
			size: 4 + Math.random() * 8,
			tx: Math.cos(angle) * distance,
			ty: Math.sin(angle) * distance,
			delay: Math.random() * 0.6,
			duration: 0.8 + Math.random() * 0.8
		};
	});

	onMount(() => {
		const timer = setTimeout(() => {
			visible = false;
			setTimeout(onDone, 400);
		}, 3500);

		return () => clearTimeout(timer);
	});

	function dismiss() {
		visible = false;
		setTimeout(onDone, 400);
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="celebration-backdrop" class:fade-out={!visible} onclick={dismiss}>
	<div class="particles" aria-hidden="true">
		{#each particles as p}
			<span
				class="particle"
				style="
					left: {p.x}%;
					top: {p.y}%;
					width: {p.size}px;
					height: {p.size}px;
					background: {p.color};
					--tx: {p.tx}px;
					--ty: {p.ty}px;
					--delay: {p.delay}s;
					--duration: {p.duration}s;
				"
			></span>
		{/each}
	</div>

	<div class="celebration-card">
		<div class="celebration-photo-wrap">
			{#if imagePath}
				<img src={imagePath} alt={name} class="celebration-photo" />
			{:else}
				<span class="celebration-avatar">{name.charAt(0).toUpperCase()}</span>
			{/if}
		</div>
		<p class="celebration-name">{name}</p>
		<p class="celebration-label">has joined the beacon!</p>
	</div>
</div>

<style>
	.celebration-backdrop {
		position: fixed;
		inset: 0;
		z-index: 3000;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: backdrop-in 0.3s ease-out;
		transition: opacity 0.4s ease;
	}

	.celebration-backdrop.fade-out {
		opacity: 0;
		pointer-events: none;
	}

	@keyframes backdrop-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.particles {
		position: fixed;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.particle {
		position: absolute;
		border-radius: 50%;
		animation: burst var(--duration) ease-out var(--delay) both;
	}

	@keyframes burst {
		0% {
			transform: translate(0, 0) scale(1);
			opacity: 1;
		}
		100% {
			transform: translate(var(--tx), var(--ty)) scale(0);
			opacity: 0;
		}
	}

	.celebration-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		animation: card-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
		z-index: 1;
	}

	@keyframes card-pop {
		0% {
			transform: scale(0.3);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.celebration-photo-wrap {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		overflow: hidden;
		border: 4px solid rgba(255, 255, 255, 0.9);
		box-shadow: 0 0 40px rgba(245, 158, 11, 0.5), 0 8px 32px rgba(0, 0, 0, 0.3);
	}

	.celebration-photo {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.celebration-avatar {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f59e0b, #ef4444);
		color: white;
		font-size: 48px;
		font-weight: 700;
	}

	.celebration-name {
		margin: 0;
		font-size: 28px;
		font-weight: 800;
		color: white;
		text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
	}

	.celebration-label {
		margin: 0;
		font-size: 16px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.85);
		text-shadow: 0 1px 8px rgba(0, 0, 0, 0.3);
	}
</style>
