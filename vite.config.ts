/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), dts()],
  server: {
    hmr: {
      port: parseInt(process.env.KUBERNETES_SERVICE_PORT, 10) || 3000,
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'feathersPinia',
      fileName: 'feathers-pinia',
    },
    sourcemap: true,
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [
        'vue-demi',
        'vue',
        'pinia',
        'lodash',
        'sift',
        '@feathersjs/commons',
        '@feathersjs/errors',
        '@feathersjs/adapter-commons',
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          'vue-demi': 'VueDemi',
          vue: 'Vue',
          pinia: 'pinia',
          lodash: 'lodash',
          sift: 'sift',
        },
      },
    },
  },
  test: {
    globals: true,
  },
})
