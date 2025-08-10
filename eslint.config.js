// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'test/prefer-lowercase-title': 'off',
    'test/no-identical-title': 'off',
    'jsdoc/require-returns-description': 'off',
  },
})
