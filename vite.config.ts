/// <reference types="vitest" />
import path from 'node:path'
import process from 'node:process'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), dts()],
  server: {
    hmr: {
      port: Number.parseInt(process.env.KUBERNETES_SERVICE_PORT as string, 10) || 3000,
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
        '@feathersjs/commons',
        '@feathersjs/errors',
        '@feathersjs/adapter-commons',
        '@feathersjs/rest-client',
        '@feathersjs/feathers',
      ],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          'vue-demi': 'VueDemi',
          'vue': 'Vue',
          'pinia': 'pinia',
          '@feathersjs/commons': 'commons',
          '@feathersjs/errors': 'errors',
          '@feathersjs/adapter-commons': 'adapterCommons',
          '@feathersjs/rest-client': 'restClient',
          '@feathersjs/feathers': 'feathers',
        },
      },
    },
  },
  test: {
    globals: true,
    deps: {
      interopDefault: true,
    },
  },
})
