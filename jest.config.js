module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.ts$', // Matches .spec.ts or .test.ts in the /tests/ directory
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testPathIgnorePatterns: ['/node_modules/'],
};