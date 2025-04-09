/**
 * ESLint plugin for enforcing Mantine UI and Next.js best practices
 */
module.exports = {
  rules: {
    'no-deprecated-props': require('./rules/no-deprecated-props'),
    'enforce-client-directive': require('./rules/enforce-client-directive')
  },
  configs: {
    recommended: {
      plugins: ['mantine'],
      rules: {
        'mantine/no-deprecated-props': 'warn',
        'mantine/enforce-client-directive': 'warn'
      }
    }
  }
};