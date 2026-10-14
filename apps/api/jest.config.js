/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts', '!src/server.ts'],
  coverageThreshold: { global: { statements: 95, branches: 90, functions: 90, lines: 95 } },
  // Test against shared's TypeScript source (its dist is ESM, which CJS Jest can't require).
  moduleNameMapper: { '^@purrdle/shared$': '<rootDir>/../../packages/shared/src/index.ts' },
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
