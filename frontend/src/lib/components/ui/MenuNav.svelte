<script lang="ts">
	const items = ['Places', 'Lists', 'Tours'] as const;
	type MenuTab = (typeof items)[number];

	let { value = 'Lists', onSelect = (_tab: MenuTab) => {} } = $props<{
		value?: MenuTab;
		onSelect?: (tab: MenuTab) => void;
	}>();
</script>

<nav class="menu-nav" aria-label="Menu sections">
	<div class="menu-nav-pill">
		{#each items as item}
			<button
				type="button"
				class="menu-nav-item"
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

	.menu-nav-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px;
		border-radius: 999px;
		background: #f3f4f6;
		box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.25);
	}

	.menu-nav-item {
		border: 0;
		background: transparent;
		padding: 6px 14px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 600;
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
