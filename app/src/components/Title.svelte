<div id="ui">
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
	<div class="text">NFT Hunter</div>
</div>

<style lang="scss">
	$fontSize: 10rem;

	@import 'https://fonts.googleapis.com/css?family=Anton';
	div {
		transform-style: preserve-3d;
		text-align: center;
	}

	#ui {
		.text {
			position: absolute;
			font-size: $fontSize;
			line-height: $fontSize;
            opacity: 0;
			font-family: Anton, sans-serif;
			transform: translate(-50%, -20%);
            mix-blend-mode: screen;

			@for $i from 0 through 100 {
				$key: $i + 1;
				&:nth-child(#{$key}) {
					$row: floor(calc($i / 20));
					color: rgba(255 - $key * 2, 50 - calc($key / 2), $key * 3, 1);
					transform-origin: random(100) -
						50 +
						floor(calc($i / 2)) *
						10% -
						$row *
						100%
						random(100) -
						50 +
						$row *
						50%;
					animation: fly#{$key} 5000ms $i * 40ms cubic-bezier(0.36, 0.1, 0.16, 1) 1 normal forwards;

					@keyframes fly#{$key} {
						$initX: random(1000) - 500;
						$initY: random(1000) - 500;
						$initZ: random(1000) - 500;
						$initDepth: random(3000) - 2500;
						0% {
							opacity: 0;
							transform: translate(-50%, 20%) rotateX(#{$initX}deg) rotateY(#{$initY}deg)
								rotateZ(#{$initZ}deg) translateZ(#{$initDepth}px);
						}
						10% {
							opacity: 0;
							transform: translate(-50%, 20%) rotateX(#{$initX}deg) rotateY(#{$initY}deg)
								rotateZ(#{$initZ}deg) translateZ(#{$initDepth}px);
						}
						90% {
							opacity: 1;
							transform: translate(-50%, 20%) rotate(0deg) rotateY(0deg) rotateZ(0deg)
								translateZ(0px);
						}
						100% {
							opacity: 1;
							transform: translate(-50%, 20%) rotate(0deg) rotateY(0deg) rotateZ(0deg)
								translateZ(0px);
						}
					}
				}
			}
		}
	}
</style>
