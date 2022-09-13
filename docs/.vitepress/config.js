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
      { text: 'Guide', link: '/guide/' },
      // {
      //   text: 'Config Reference',
      //   link: '/config/basics',
      //   activeMatch: '^/config/'
      // },
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
      text: 'Guide',
      items: [
        { text: "What's New", link: '/guide/whats-new' },
        { text: 'Introduction', link: '/guide/' },
        { text: 'Getting Started', link: '/guide/setup' },
        { text: 'Module Overview', link: '/guide/module-overview' },
      ],
    },
    {
      text: '🚧 Migration Guides 🚧',
      items: [
        { text: 'Migrate from Vuex', link: '/guide/migrate-from-feathers-vuex' },
        { text: 'Migrate from 0.x', link: '/guide/migrate-from-v0' },
      ],
    },
    {
      text: 'Pinia Stores',
      items: [
        { text: 'Service Stores', link: '/guide/service-stores' },
        { text: 'Auth Stores', link: '/guide/auth-stores' },
      ],
    },
    {
      text: 'Data Modeling',
      items: [
        { text: 'Model Classes', link: '/guide/model-classes' },
        { text: 'BaseModel', link: '/guide/base-model' },
        { text: 'Model Instances', link: '/guide/model-instances' },
        { text: 'Model Associations', link: '/guide/model-associations' },
      ],
    },
    {
      text: 'Common Tools',
      items: [
        { text: 'useFind', link: '/guide/use-find' },
        { text: 'useGet', link: '/guide/use-get' },
        { text: 'useClones', link: '/guide/use-clones' },
        { text: 'usePagination', link: '/guide/use-pagination' },
        { text: 'useFindWatched ⚠️', link: '/guide/use-find-watched' },
      ],
    },
    {
      text: 'Storage Sync',
      items: [{ text: 'syncWithStorage', link: '/guide/storage-sync' }],
    },
  ]
}
