import pluginNext from '@next/eslint-plugin-next';

export default [
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts', '.source/**'],
  },
  {
    name: 'nextjs',
    plugins: {
      '@next/next': pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
];
