module.exports = {
  extends: [
    'react-app',
  ],
  plugins: [
    'baseui',
  ],
  rules: {
    'baseui/deprecated-theme-api': 'warn',
    'baseui/deprecated-component-api': 'warn',
    'baseui/no-deep-imports': 'warn',

    'no-warning-comments': 0,
    'indent': ['error', 2],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': [
      'error',
      'always',
      {
        'arraysInObjects': false,
        'objectsInObjects': true,
      },
    ],
  },
};
