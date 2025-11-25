module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/', '<rootDir>/libs/'],
  moduleNameMapper: {
    '^@libs/domain$': '<rootDir>/libs/domain/src/index',
    '^@libs/domain/(.*)$': '<rootDir>/libs/domain/src/$1',
    '^@libs/application$': '<rootDir>/libs/application/src/index',
    '^@libs/application/(.*)$': '<rootDir>/libs/application/src/$1',
    '^@libs/infrastructure$': '<rootDir>/libs/infrastructure/src/index',
    '^@libs/infrastructure/(.*)$': '<rootDir>/libs/infrastructure/src/$1',
    '^@libs/shared$': '<rootDir>/libs/shared/src/index',
    '^@libs/shared/(.*)$': '<rootDir>/libs/shared/src/$1',
  },
};

