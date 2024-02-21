import { defineConfig } from 'vitepress'
import pkg from '../../package.json'

export default defineConfig({
  title: 'Feathers-Pinia',
  description: 'Connect Vue to Feathers',
  lang: 'en-US',
  head: [
    ['link', {
      rel: 'icon',
      href: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🍍</text></svg>',
    }],
  ],
  themeConfig: {
    search: {
      provider: 'local',
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/marshallswain/feathers-pinia',
      },
    ],
    footer: {
      message:
        'Many thanks go to the Vue and FeathersJS communities for keeping software development FUN!',
      copyright: 'MIT Licensed',
    },
    nav: [
      { text: 'Setup', link: '/setup/' },
      { text: 'API Guides', link: '/guide/' },
      {
        text: pkg.version,
        items: [
          {
            text: 'Release Notes',
            link: 'https://github.com/marshallswain/feathers-pinia/releases',
          },
          {
            text: 'Docs v3',
            link: 'https://v3.feathers-pinia.pages.dev/',
          },
          {
            text: 'Docs v2',
            link: 'https://v2.feathers-pinia.pages.dev/',
          },
          {
            text: 'Docs v1',
            link: 'https://v1.feathers-pinia.pages.dev/',
          },
          {
            text: 'Docs v0',
            link: 'https://v0.feathers-pinia.pages.dev/',
          },
        ],
      },
    ],
    sidebar: {
      '/setup/': getSetupSidebar(),
      '/migrate/': getSetupSidebar(),
      '/guide/': getGuideSidebar(),
      '/app/': getGuideSidebar(),
      '/': getGuideSidebar(),
    },
  },
})

function getSetupSidebar() {
  return [
    {
      text: 'Start a Project',
      items: [
        { text: 'Overview', link: '/setup/' },
        { text: 'Install', link: '/setup/install' },
        {
          text: 'Setup',
          items: [
            { text: 'Vite', link: '/setup/vite' },
            { text: 'Nuxt 3', link: '/setup/nuxt3' },
            { text: 'Quasar', link: '/setup/quasar' },
          ],
        },
        { text: 'Example Apps', link: '/setup/example-apps' },
        { text: 'Other Setup Examples', link: '/setup/other' },
      ],
    },
    {
      text: 'Migration Guides',
      items: [
        { text: 'Models to Services', link: '/migrate/models' },
        { text: 'Clone Handling', link: '/migrate/handle-clones' },
        { text: 'from Vuex', link: '/migrate/from-feathers-vuex' },
        { text: 'from 0.x', link: '/migrate/from-v0' },
      ],
    },
  ]
}

function getGuideSidebar() {
  return [
    {
      text: 'Introduction',
      items: [
        { text: '🎁 What\'s New in v4', link: '/guide/whats-new' },
        { text: '🎁 What\'s New in v3', link: '/guide/whats-new-v3' },
        { text: 'Introduction', link: '/guide/' },
        { text: 'Module Overview', link: '/guide/module-overview' },
      ],
    },
    {
      text: 'Feathers-Pinia Client',
      items: [
        { text: 'Client API', link: '/guide/create-pinia-client' },
        { text: 'Common Pitfalls', link: '/guide/troubleshooting' },
      ],
    },
    {
      text: 'Feathers-Pinia Services',
      items: [
        { text: 'Service API', link: '/services/' },
        { text: 'Service Stores', link: '/services/stores' },
        { text: 'Instance API', link: '/services/instances' },
        {
          text: 'Hybrid Queries',
          link: '/services/hybrid-queries',
          items: [
            { text: 'useFind', link: '/services/use-find' },
            { text: 'useGet', link: '/services/use-get' },
          ],
        },
        { text: 'Common Patterns', link: '/guide/common-patterns' },
      ],
    },
    {
      text: 'Data Modeling',
      items: [
        { text: 'Data Modeling in v4.2+', link: '/guide/data-modeling' },
        { text: 'useInstanceDefaults', link: '/guide/use-instance-defaults' },
        { 
          text: 'Deprecated APIs', 
          items: [
            { text: 'storeAssociated', link: '/guide/store-associated' },
            { text: 'Utilities', link: '/guide/utilities' },
          ]
        }
      ],
    },
    {
      text: 'Standalone Data Stores',
      items: [
        { text: 'Data Stores', link: '/data-stores/' },
        { text: 'Instance API', link: '/data-stores/instances' },
        { text: 'Querying Data', link: '/data-stores/querying-data' },
      ],
    },
    {
      text: 'Auth Stores',
      items: [{ text: 'useAuth - Auth Stores', link: '/guide/use-auth' }],
    },
    {
      text: 'Other Tools',
      items: [
        { text: 'useBackup', link: '/guide/use-backup' },
        { text: 'Storage Sync', link: '/guide/storage-sync' },
        { text: 'Auto-Imports', link: '/guide/auto-imports' },
        { text: 'Nuxt Module', link: '/guide/nuxt-module' },
        { text: 'OFetch', link: '/guide/ofetch' },
      ],
    },
  ]
}
