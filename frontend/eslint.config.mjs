import antfu from 'eslint-plugin-antfu'

export default [
  {
    plugins: {
      antfu,
    },
    rules: {
      'antfu/consistent-list-newline': 'error',
      'antfu/if-newline': 'error',
      'antfu/top-level-function': 'error',
    },
  },
]
