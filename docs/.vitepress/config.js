module.exports = {
  title: 'Feathers-Pinia',
  description: 'Connect Feathers.',
  lang: 'en-US',
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/marshallswain/feathers-pinia',
      },
    ],
    footer: {
      message:
        'Many thanks go to the Vue, Vuex, Pinia, and FeathersJS communities for keeping software development FUN!',
      copyright: 'MIT Licensed',
    },
    nav: [
      { text: 'Guide & APIs', link: '/guide/' },
      {
        text: 'Release Notes',
        link: 'https://github.com/marshallswain/feathers-pinia/releases',
      },
    ],
    sidebar: {
      '/guide/': getGuideSidebar(),
      // "/config/": getConfigSidebar(),
      '/': getGuideSidebar(),
    },
  },
}

function getGuideSidebar() {
  return [
    {
      text: 'Introduction',
      items: [
        { text: "What's New 🎁", link: '/guide/whats-new' },
        { text: 'Introduction', link: '/guide/' },
        { text: 'Module Overview', link: '/guide/module-overview' },
      ],
    },
    {
      text: 'Start a Project',
      items: [
        { text: 'Overview', link: '/guide/get-started' },
        { text: 'Install Modules', link: '/guide/setup' },
        { text: 'with Vite 🚧', link: '/guide/setup-vite' },
        { text: 'with Nuxt 3 🚧', link: '/guide/setup-nuxt3' },
        { text: 'with Quasar 🚧', link: '/guide/setup-quasar' },
        { text: 'Example Apps', link: '/guide/example-apps' },
        { text: 'Other Setup Examples', link: '/guide/setup-other' },
      ],
    },
    {
      text: 'Migration Guides',
      items: [
        { text: 'Migrate Models', link: '/guide/migrate-models' },
        { text: 'Migrate handleClones', link: '/guide/migrate-handle-clones' },
        { text: 'Migrate from Vuex 🚧', link: '/guide/migrate-from-feathers-vuex' },
        { text: 'Migrate from 0.x', link: '/guide/migrate-from-v0' },
      ],
    },
    {
      text: 'Data Modeling',
      items: [
        { text: 'Overview', link: '/guide/modeling-overview' },
        {
          text: 'Model Functions',
          link: '/guide/model-functions',
          items: [
            { text: 'BaseModel', link: '/guide/use-base-model' },
            { text: 'FeathersModel', link: '/guide/use-feathers-model' },
            { text: 'Shared Utils', link: '/guide/model-functions-shared' },
          ],
        },
        {
          text: 'Model Instances',
          link: '/guide/model-instances',
          items: [
            { text: 'BaseModel Instances', link: '/guide/use-base-model-instances' },
            { text: 'FeathersModel Instances', link: '/guide/use-feathers-model-instances' },
          ],
        },
        {
          text: 'Model Associations',
          link: '/guide/model-associations',
          items: [
            { text: 'associateFind', link: '/guide/associate-find' },
            { text: 'associateGet', link: '/guide/associate-get' },
          ],
        },
        { text: 'Common Patterns', link: '/guide/common-patterns' },
      ],
    },
    {
      text: 'Stores',
      items: [
        { text: 'Overview', link: '/guide/stores-overview' },
        {
          text: 'Model Stores',
          link: '/guide/model-stores',
          items: [
            { text: 'BaseModel Stores', link: '/guide/use-base-model-stores' },
            { text: 'FeathersModel Stores', link: '/guide/use-feathers-model-stores' },
          ],
        },
        {
          text: 'Pinia Stores',
          link: '/guide/pinia-stores',
          items: [
            { text: 'Service Stores - useService', link: '/guide/use-service' },
            { text: 'Auth Stores - useAuth', link: '/guide/use-auth' },
          ],
        },
      ],
    },
    {
      text: 'Common Tools',
      items: [
        { text: 'Feathers Client Hooks', link: '/guide/hooks' },
        { text: 'useFind', link: '/guide/use-find' },
        { text: 'useGet', link: '/guide/use-get' },
        { text: 'useClone', link: '/guide/use-clone' },
        { text: 'useClones', link: '/guide/use-clones' },
      ],
    },
    {
      text: 'Other Tools',
      items: [
        { text: 'OFetch', link: '/guide/ofetch' },
        { text: 'syncWithStorage', link: '/guide/storage-sync' },
      ],
    },
    {
      text: 'Pending Removal in 2.0',
      items: [
        { text: 'defineStore ⚠️', link: '/guide/define-store' },
        { text: 'defineAuthStore ⚠️', link: '/guide/auth-stores' },
        { text: 'useFindWatched ⚠️', link: '/guide/use-find-watched' },
        { text: 'useGetWatched ⚠️', link: '/guide/use-get-watched' },
        { text: 'usePagination ⚠️', link: '/guide/use-pagination' },
      ],
    },
  ]
}
