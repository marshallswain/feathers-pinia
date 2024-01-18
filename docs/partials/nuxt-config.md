```ts
// nuxt.config.ts
// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    'nuxt-feathers-pinia',
  ],
  imports: {
    // Not required, but useful: list folder names here to enable additional "composables" folders.
    dirs: [],
  },
  // Enable Nuxt Takeover Mode
  typescript: {
    shim: false,
  },
  // optional, Vue Reactivity Transform
  experimental: {
    reactivityTransform: true,
  },
})
```

You can read more about the above configuration at these links:

- [@pinia/nuxt module](https://pinia.vuejs.org/ssr/nuxt.html)
- [nuxt-feathers-pinia module](/guide/nuxt-module)
- [Nuxt `imports` config](https://nuxt.com/docs/api/configuration/nuxt-config#imports)
- [Nuxt Takeover Mode](https://nuxt.com/docs/getting-started/installation#prerequisites)
- [Vue Reactivity Transform](https://vuejs.org/guide/extras/reactivity-transform.html)

If you use `npm` as your package manager and you see the error `ERESOLVE unable to resolve dependency tree`, add this to
your package.json:

```json
{
  "overrides": {
    "vue": "latest"
  }
}
```
