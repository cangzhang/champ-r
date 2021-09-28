module.exports = {
  extends: ['react-app'],
  plugins: ['baseui'],
  rules: {
    'baseui/deprecated-theme-api': 'warn',
    'baseui/deprecated-component-api': 'warn',
    'baseui/no-deep-imports': 'warn',
    'no-warning-comments': 0,
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': [2, 'always']
  },
};
