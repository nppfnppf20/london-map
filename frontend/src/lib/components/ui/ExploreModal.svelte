<script lang="ts">
	let { open = false, onClose = () => {}, onNear = () => {}, onRoute = () => {} } = $props<{
		open?: boolean;
		onClose?: () => void;
		onNear?: () => void;
		onRoute?: () => void;
	}>();

	const options = [
		'Food',
		'Pubs',
		'Nature',
		'Galleries',
		'Museums',
		"What's On",
		'Architecture',
		'History',
		'Parks'
	] as const;

	let selected = $state<Set<string>>(new Set());
	let step = $state<'categories' | 'search'>('categories');

	function toggleOption(label: string) {
		const next = new Set(selected);
		if (next.has(label)) {
			next.delete(label);
		} else {
			next.add(label);
		}
		selected = next;
	}

	function selectAll() {
		if (selected.size === options.length) {
			selected = new Set();
			return;
		}
		selected = new Set(options);
	}

	function goNext() {
		step = 'search';
	}
</script>

{#if open}
	<div class="explore-panel" role="dialog" aria-modal="true">
		<div class="explore-header">
			<h2>{step === 'categories' ? 'What are you looking for?' : 'Where are you looking?'}</h2>
			<button class="close-btn" onclick={onClose} aria-label="Close">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12"/>
				</svg>
			</button>
		</div>
		{#if step === 'categories'}
			<div class="explore-body">
				<div class="explore-grid">
					<div class="choice-grid">
						<button
							class="card-btn"
							class:active={selected.size === options.length}
							type="button"
							onclick={selectAll}
						>
							Anything (select all)
						</button>
						{#each options as option}
							<button
								class="card-btn"
								class:active={selected.has(option)}
								type="button"
								onclick={() => toggleOption(option)}
							>
								{option}
							</button>
						{/each}
					</div>
				</div>
			</div>
			<div class="ui-footer-actions">
				<button class="ui-btn ui-btn-danger" disabled={selected.size === 0} onclick={goNext}>
					Next
				</button>
			</div>
		{:else}
			<div class="explore-body">
				<div class="choice-grid">
					<button class="card-btn" type="button" onclick={onNear}>Search by area</button>
					<button class="card-btn" type="button" onclick={onRoute}>Search along route</button>
				</div>
			</div>
		{/if}
	</div>
{/if}

<style>
	.explore-panel {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		background: white;
		display: flex;
		flex-direction: column;
	}

	.explore-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--spacing-md) var(--spacing-lg);
		border-bottom: 1px solid var(--gray-200);
	}

	.explore-header h2 {
		margin: 0;
		font-size: 16px;
		font-weight: 700;
		color: var(--color-primary);
	}

	.explore-body {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		flex: 1;
	}

	.explore-grid {
		flex: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding-right: 2px;
	}


</style>
