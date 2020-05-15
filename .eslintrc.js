module.exports = {
  extends: ['react-app'],
  plugins: ['baseui'],
  rules: {
    'baseui/deprecated-theme-api': 'warn',
    'baseui/deprecated-component-api': 'warn',
    'baseui/no-deep-imports': 'warn',
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
      },
    ],
    'no-warning-comments': 0,
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': [
      'error',
      'always',
      {
        arraysInObjects: false,
        objectsInObjects: true,
      },
    ],
  },
};
