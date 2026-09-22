module.exports = {
    clearMocks: true,
    moduleFileExtensions: ['js', 'json', 'ts', 'node'],
    roots: ['<rootDir>/test'],
    testEnvironment: 'node',
    transform: { '^.+\\.ts$': 'ts-jest' }
};
