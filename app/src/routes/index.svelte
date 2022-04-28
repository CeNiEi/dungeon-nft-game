<script lang="ts">
	import NftTitle from '../components/NftTitle.svelte';
	import NftButton from '../components/NftButton.svelte';
	import { goto } from '$app/navigation';

	const goToInstructions = () => {
		console.log("reached");
		goto('game');
	};
</script>

<NftTitle />
<div class="container">
	<NftButton/>
</div>

<style lang="scss">
	.container {
		animation: fadeIn 5000ms ease-in;
		transform: translate(0, 550%);

		@keyframes fadeIn {
			0% {
				opacity: 0;
			}
			50% {
				opacity: 0;
			}
			100% {
				opacity: 1;
			}
		}
	}
</style>
