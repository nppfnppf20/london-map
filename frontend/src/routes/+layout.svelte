<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { authStore } from '$stores/auth';

	let { children } = $props();

	onMount(() => {
		authStore.initialize();
	});
</script>

<div class="app">
	{@render children()}
</div>

<style>
	.app {
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}
</style>
