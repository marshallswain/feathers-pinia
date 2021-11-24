module.exports = {
  title: 'Feathers-Pinia',
  description: 'Connect Feathers.',
  lang: 'en-US',
  themeConfig: {
    nav: [
      // { text: "Guide", link: "/", activeMatch: "^/$|^/guide/" },
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
      children: [
        { text: 'Introduction', link: '/guide/' },
        { text: 'Module Overview', link: '/guide/module-overview' },
        { text: 'Setup', link: '/guide/setup' },
      ],
    },
    {
      text: 'Pinia Stores',
      children: [
        { text: 'Service Stores', link: '/guide/service-stores' },
        { text: 'Auth Stores', link: '/guide/auth-stores' },
      ],
    },
    {
      text: 'Data Modeling',
      children: [
        { text: 'Model Classes', link: '/guide/model-classes' },
        { text: '🚧 BaseModel', link: '/guide/base-model' },
        { text: '🚧 Model Instances', link: '/guide/model-instances' },
      ],
    },
    {
      text: 'Common Tools',
      children: [
        { text: 'useFind', link: '/guide/use-find' },
        { text: 'useGet', link: '/guide/use-get' },
        { text: '🚧 usePagination', link: '/guide/use-pagination' },
        { text: 'handleClones', link: '/guide/handle-clones' },
      ],
    },
    {
      text: 'Storage Sync',
      children: [{ text: 'syncWithStorage', link: '/guide/storage-sync' }],
    },
  ]
}
