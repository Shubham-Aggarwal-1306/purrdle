/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
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
