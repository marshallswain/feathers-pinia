import { fileURLToPath } from 'url'
import { addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit'


export default defineNuxtModule({
  meta: {
    name: 'nuxt-feathers-pinia',
    configKey: 'feathersPinia',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url))
    nuxt.options.build.transpile.push(runtimeDir)

    addPlugin(resolve(runtimeDir, 'plugin'))

    const composables = resolve(runtimeDir, 'composables/index')
    addImports([
      // Internal composables
      { from: composables, name: 'connectModel' },
      { from: composables, name: 'onModelReady' },
      { from: composables, name: 'useModel' },

      // Feathers-Pinia composables
      { from: composables, name: 'associateGet' },
      { from: composables, name: 'associateFind' },
      { from: composables, name: 'feathersPiniaHooks' },
      { from: composables, name: 'useInstanceDefaults' },
      { from: composables, name: 'useFeathersInstance' },
      { from: composables, name: 'useFeathersModel' },
      { from: composables, name: 'useBaseModel' },
      { from: composables, name: 'useService' },
      { from: composables, name: 'useFind' },
      { from: composables, name: 'useGet' },
      { from: composables, name: 'useAuth' },
      { from: composables, name: 'useClone' },
      { from: composables, name: 'useClones' },
    ])
  },
})
