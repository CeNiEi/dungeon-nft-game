<script>
	import { WalletMultiButton } from '@svelte-on-solana/wallet-adapter-ui';
	import Title from '../components/Title.svelte';
</script>

<Title />
<div class="container">
	<button class="button">Enter</button>
</div>


<style lang="scss">
	/*
	.container {
		display: table;
		margin-right: auto;
		margin-left: auto;
	}
	*/
	.container {
		position: absolute;
		left: 50%;
		top: 80%;
		-moz-transform: translate(-50%, -50%); 
		-ms-transform: translate(-50%, -50%); 
		-webkit-transform: translate(-50%, -50%); 
		-o-transform: translate(-50%, -50%); 
		transform: translate(-50%, -50%);
		height: 100px;
		width: 200px;
	}
	.button {
		align-items: center;
		background-color: #2a971c;
		border: 2px solid #111;
		border-radius: 8px;
		box-sizing: border-box;
		color: #111;
		cursor: pointer;
		display: flex;
		font-family: Inter, sans-serif;
		font-size: 16px;
		height: 75px;
		width: 500px;
		justify-content: center;
		line-height: 24px;
		max-width: 100%;
		padding: 50px 25px;
		position: relative;
		text-align: center;
		text-decoration: none;
		user-select: none;
		-webkit-user-select: none;
		touch-action: manipulation;

		&:after {
			background-color: rgb(12, 41, 0);
			border-radius: 8px;
			content: '';
			display: block;
			height: 75px;
			width: 500px;
			left: 0;
			width: 100%;
			position: absolute;
			top: -2px;
			transform: translate(8px, 8px);
			transition: transform 0.2s ease-out;
			z-index: -1;
		}

		&:hover {
			&:after {
				transform: translate(0, 0);
			}

			outline: 0;
		}

		&:active {
			background-color: #579919;
			outline: 0;
		}
	}

	@media (min-width: 768px) {
		.button {
			padding: 0 40px;
		}
	}
</style>

