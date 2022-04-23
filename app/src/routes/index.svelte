<script lang="ts">
	import { onMount } from 'svelte';
	//import init, { game_starter } from 'my_game';
    import init, {game_starter} from 'my_game';

	function loadWASM() {
		var canvas = document.createElement('canvas');
		console.log(canvas.id);
		canvas.id = 'canvas';
		canvas.width = 640;
		canvas.height = 480;
		document.body.appendChild(canvas);

		init('http://0.0.0.0:3000/assets/my_game_bg.wasm').then(() => {
			console.log('init wasm-pack');
            game_starter();
		});
	}

	onMount(() => {
		loadWASM();
	});
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
