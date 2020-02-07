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
	},
};
