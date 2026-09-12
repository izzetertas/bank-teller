import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

const config = [
  ...coreWebVitals,
  ...typescript,
  // Must stay last: turns off any ESLint stylistic rule that would fight
  // Prettier's formatting, so `lint` and `format` never disagree.
  prettier,
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
];

export default config;
