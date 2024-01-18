---
outline: deep
---
<script setup>
import Badge from '../components/Badge.vue'
import BlockQuote from '../components/BlockQuote.vue'
</script>

# Auto-Imports

[[toc]]

Auto-Imports are amazing!. 🎉 They keep code clean and decoupled. As an added bonus, you no longer have to manually
import modules at the top of every file. Feathers-Pinia comes with auto-import modules targeted at improving developer
experience.

This page shows how to set up auto-imports for Single Page Apps, followed by an overview of the available
auto-imports. The [Nuxt module](/guide/nuxt-module) documentation shows how to install Nuxt SSR-friendly versions of
these same utilities.

## Preset for `unplugin-auto-import`

Feathers-Pinia v3 includes a preset for `unplugin-auto-import`, a plugin which enables auto-import for Vite, Rollup,
Webpack, Quasar, and more. [See setup instructions for your environment](https://github.com/antfu/unplugin-auto-import).

Once you've installed `unplugin-auto-import`, you can use the `feathersPiniaAutoImport` preset. Here is a truncated
example of a `vite.config.ts` file:

```ts{4,22}
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { feathersPiniaAutoImport } from 'feathers-pinia'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Vue({
      reactivityTransform: true,
    }),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'vue-i18n',
        'vue/macros',
        '@vueuse/head',
        '@vueuse/core',
        feathersPiniaAutoImport,
      ],
      dts: 'src/auto-imports.d.ts',
      dirs: ['src/composables'],
      vueTemplate: true,
    }),
  ],
})
```

To enable custom auto-import folders, use the `dirs` option, shown above.

<BlockQuote>
You have to start (and sometimes restart) the dev server for new auto-imports to become available.
</BlockQuote>

<BlockQuote label="Nuxt Module">

For Nuxt apps, use the [Nuxt Module](./nuxt-module.md).

</BlockQuote>

<!--@include: ../partials/auto-imports-overview.md-->
