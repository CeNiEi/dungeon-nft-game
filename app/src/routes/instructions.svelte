<script>
	import NftButton from '../components/NftButton.svelte';
</script>

<div class="title">INSTRUCTIONS</div>
<div class="supercontainer">
	<div class="container">
		<div class="list">
			<div class="num">
				<h3>
					Pay up an entry fee.
					<br /> If you win, you get double the money back :D
					<br />Otherwise you go home empty handed :(
				</h3>
			</div>
			<div class="num">
				<h3>
					The Game is a simple Dungeon Crawler.
					<br /> Use Arrow Keys to explore the Dungeon and defeat monsters!
					<br /> Find healing potions and try not to die!
					<br /> Find the secret Key to get out of the Dungeon to Win!!
				</h3>
			</div>
			<div class="num">
				<h3>
					Open the Left Drawer to Connect to your Solana Wallet
					<br /> And do Not forget to Enjoy!
				</h3>
			</div>
		</div>
	</div>
</div>
<div class="address">
	<NftButton />
</div>

<style lang="scss">
	@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@1,900&display=swap');
	.address {
		position: absolute;
		left: 40%;
		top: 80%;
		border-radius: 5px;
		padding: 10px;
	}
	.title {
		position: absolute;
		left: 0;
		top: 0;
		font-family: 'Poppins', sans-serif;
		margin-top: 0rem;
		display: block;
		transform: translate(17%, 0);
		color: #cf1b1b;
		font-size: 124px;
		letter-spacing: 8px;

		&::before {
			content: 'INSTRUCTIONS';
			position: absolute;
			color: transparent;
			background-image: repeating-linear-gradient(
				45deg,
				transparent 0,
				transparent 2px,
				white 2px,
				white 4px
			);
			background-clip: text;
			-webkit-background-clip: text;
			top: 0px;
			left: 0px;
			z-index: -1;
			transition: 1s;
		}

		&::after {
			content: 'INSTRUCTIONS';
			position: absolute;
			color: transparent;
			background-image: repeating-linear-gradient(
				135deg,
				transparent 0,
				transparent 2px,
				white 2px,
				white 4px
			);
			background-clip: text;
			-webkit-background-clip: text;
			top: 0px;
			left: 0px;
			transition: 1s;
		}

		&:hover {
			&:before {
				top: 10px;
				left: 10px;
			}

			&:after {
				top: -10px;
				left: -10px;
			}
		}
	}

	.container {
		font-family: 'Poppins', sans-serif;
		.list {
			.num {
				display: flex;
				font-size: 5rem;
				align-items: center;
				transition: 0.25s;
				&:nth-child(1):before {
					content: '1';
					font-size: 4rem;
					font-weight: bold;
					color: rgb(238, 23, 166);
					width: 2rem;
					opacity: 0;
					transition: 0.25s;
				}
				&:nth-child(2):before {
					content: '2';
					font-size: 4rem;
					font-weight: bold;
					color: rgb(238, 23, 166);
					width: 2rem;
					opacity: 0;
					transition: 0.25s;
				}
				&:nth-child(3):before {
					content: '3';
					font-size: 4rem;
					font-weight: bold;
					color: rgb(238, 23, 166);
					width: 2rem;
					opacity: 0;
					transition: 0.25s;
				}
				h3 {
					position: relative;
					left: -1.5rem;
					color: #2cbbce;
					font-size: 1rem;
					transition: 0.25s;
				}
				&:hover {
					cursor: pointer;
					&:before {
						opacity: 1;
					}
					h3 {
						left: 1rem;
					}
				}
			}
		}
	}

	.supercontainer {
		display: flex;
		flex-direction: column;
		align-items: center;
		transform: translate(0, 50%);
	}
</style>
