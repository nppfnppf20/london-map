<script lang="ts">
	const items = ['Places', 'Lists', 'Tours'] as const;
	type MenuTab = (typeof items)[number];

	let { value = 'Lists', onSelect = (_tab: MenuTab) => {} } = $props<{
		value?: MenuTab;
		onSelect?: (tab: MenuTab) => void;
	}>();
</script>

<nav class="menu-nav" aria-label="Menu sections">
	<div class="menu-nav-pill ui-pill">
		{#each items as item}
			<button
				type="button"
				class="menu-nav-item ui-btn ui-btn-sm ui-btn-pill"
				class:active={item === value}
				aria-pressed={item === value}
				onclick={() => onSelect(item)}
			>
				{item}
			</button>
		{/each}
	</div>
</nav>

<style>
	.menu-nav {
		display: flex;
		justify-content: center;
	}

	.menu-nav-item {
		background: transparent;
		color: #6b7280;
		letter-spacing: 0.01em;
		-webkit-tap-highlight-color: transparent;
	}

	.menu-nav-item.active {
		background: white;
		color: #111827;
		box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
	}
</style>
