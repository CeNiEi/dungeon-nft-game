<script lang="ts">
	import { onMount } from 'svelte';
	//@ts-ignore
	import init, { game_starter } from 'yet_another_dungeon_crawler';

	function loadWASM() {
		var canvas = document.createElement('canvas');
		console.log(canvas.id);
		canvas.id = 'canvas';
		canvas.width = 640;
		canvas.height = 480;
		document.body.appendChild(canvas);

		init('http://0.0.0.0:3000/assets/yet_another_dungeon_crawler_bg.wasm').then(() => {
			console.log('init wasm-pack');
		});
	}

	onMount(() => {
		loadWASM();
	});
</script>

