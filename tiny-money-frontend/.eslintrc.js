module.exports = {
  root: true,

  env: {
    node: true,
  },

  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],

  rules: {
    'no-console': 'off',
    'no-debugger': 'off',
    'linebreak-style': 0,
    'no-param-reassign': 0
  },

  parserOptions: {
    parser: 'babel-eslint',
  },

  'extends': [
    'plugin:vue/strongly-recommended',
    '@vue/airbnb'
  ]
};
