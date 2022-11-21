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
        { text: 'Install Modules', link: '/guide/setup' },
        { text: 'with Vite', link: '/guide/setup-vite' },
        { text: 'with Nuxt 3', link: '/guide/setup-nuxt3' },
        { text: 'with Quasar 🚧', link: '/guide/setup-quasar' },
        { text: 'Example Apps', link: '/guide/example-apps' },
        { text: 'Other Setup Examples', link: '/guide/setup-other' },
      ],
    },
    {
      text: 'Migration Guides 🚧',
      items: [
        { text: 'Migrate from Vuex', link: '/guide/migrate-from-feathers-vuex' },
        { text: 'Migrate from 0.x', link: '/guide/migrate-from-v0' },
      ],
    },
    {
      text: 'Pinia Stores',
      items: [
        { text: 'Service Stores', link: '/guide/service-stores' },
        { text: 'Auth Stores (useAuth)', link: '/guide/use-auth' },
        { text: 'defineAuthStore⚠️', link: '/guide/auth-stores' },
      ],
    },
    {
      text: 'Data Modeling',
      items: [
        { text: 'Model Classes', link: '/guide/model-classes' },
        { text: 'BaseModel', link: '/guide/base-model' },
        { text: 'Model Instances', link: '/guide/model-instances' },
        { text: 'Model Associations', link: '/guide/model-associations' },
        { text: 'Common Patterns', link: '/guide/common-patterns' },
      ],
    },
    {
      text: 'Common Tools',
      items: [
        { text: 'useFind', link: '/guide/use-find' },
        { text: 'useGet', link: '/guide/use-get' },
        { text: 'useClones', link: '/guide/use-clones' },
        { text: 'associateFind', link: '/guide/associate-find' },
        { text: 'associateGet', link: '/guide/associate-get' },
      ],
    },
    {
      text: 'Other Tools',
      items: [
        { text: 'syncWithStorage', link: '/guide/storage-sync' },
        { text: 'useFindWatched ⚠️', link: '/guide/use-find-watched' },
        { text: 'useGetWatched ⚠️', link: '/guide/use-get-watched' },
        { text: 'usePagination ⚠️', link: '/guide/use-pagination' },
      ],
    },
  ]
}
