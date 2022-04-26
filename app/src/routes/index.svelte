<script lang="ts">
	import Title from '../components/Title.svelte';
	import Button from '../components/Button.svelte';
	import { goto } from '$app/navigation';

	const goToInstructions = () => {
		goto('game');
	}

</script>

<Title />
<div class="container">
	<Button clickHandler={goToInstructions} />	
</div>

<style lang="scss">
	.container {
		position: absolute;

		-moz-transform: translate(-50%, 600%);
		-ms-transform: translate(-50%, 600%);
		-webkit-transform: translate(-50%, 600%);
		-o-transform: translate(-50%, 600%);
		transform: translate(-50%, 600%);

		animation: fadeIn 5000ms ease-in;

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
