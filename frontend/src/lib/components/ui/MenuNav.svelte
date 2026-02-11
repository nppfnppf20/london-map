<script lang="ts">
	const allItems = ['Places', 'Lists', 'Tours', 'Beacons'] as const;
	type MenuTab = (typeof allItems)[number];

	let { value = 'Lists', onSelect = (_tab: MenuTab) => {}, badge = 0, showBeacons = false } = $props<{
		value?: MenuTab;
		onSelect?: (tab: MenuTab) => void;
		badge?: number;
		showBeacons?: boolean;
	}>();

	let items = $derived(showBeacons ? allItems : allItems.filter(i => i !== 'Beacons'));
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
				{#if item === 'Beacons' && badge > 0}
					<span class="menu-nav-badge">{badge}</span>
				{/if}
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
		position: relative;
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

	.menu-nav-badge {
		position: absolute;
		top: -4px;
		right: -4px;
		min-width: 16px;
		height: 16px;
		padding: 0 4px;
		border-radius: 999px;
		background: #ef4444;
		color: white;
		font-size: 10px;
		font-weight: 700;
		line-height: 16px;
		text-align: center;
	}
</style>
