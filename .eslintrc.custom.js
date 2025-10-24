module.exports = {
  extends: ['./eslint.config.mjs'],
  rules: {
    // Custom rules for API constants compliance
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="fetch"] > Literal[value=/^\\/api\\//]',
        message: 'Use API constants instead of hardcoded URLs. Import and use makeClientAuthenticatedRequestWithEndpoint or makeClientAuthenticatedRequestWithPath from @/lib/client-api-utils'
      },
      {
        selector: 'CallExpression[callee.name="fetch"] > TemplateLiteral[quasis.0.value.raw=/^\\/api\\//]',
        message: 'Use API constants instead of hardcoded URLs. Import and use makeClientAuthenticatedRequestWithEndpoint or makeClientAuthenticatedRequestWithPath from @/lib/client-api-utils'
      }
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/lib/auth-utils'],
            message: 'Use @/lib/client-api-utils instead of @/lib/auth-utils for client-side API calls'
          }
        ]
      }
    ]
  }
};
