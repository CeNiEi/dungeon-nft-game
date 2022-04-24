import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';
import wasmPack from 'vite-plugin-wasm-pack';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: adapter(),

		vite: () => ({
			plugins: [wasmPack(['./yet_another_dungeon_crawler'], [])],
			//optimizeDeps: {
			//	exclude: ['./my_game']
			//}

		})
	}

};

export default config;
