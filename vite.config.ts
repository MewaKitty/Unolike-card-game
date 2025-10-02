import legacy from '@vitejs/plugin-legacy'
import topLevelAwait from "vite-plugin-top-level-await";
import { defineConfig } from 'vite'

export default defineConfig({
  base: "https://mewakitty.github.io/Uno-like_card_game/",
  plugins: [
    legacy({
      targets: ['defaults', 'cover 90%'],
    }),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: "__tla",
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: i => `__tla_${i}`
    }),
  ],
})