/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/__fixtures__/**',
    '!src/index.ts',
  ],
  coverageThreshold: { global: { statements: 95, branches: 90, functions: 95, lines: 95 } },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      // Jest runs CommonJS; production builds use NodeNext ESM via tsc.
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node10',
          allowImportingTsExtensions: true,
          rewriteRelativeImportExtensions: false,
          noEmit: true,
          isolatedModules: true,
          ignoreDeprecations: '6.0',
        },
      },
    ],
  },
};
