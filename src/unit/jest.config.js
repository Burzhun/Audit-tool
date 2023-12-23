module.exports = {
  automock: false, // [boolean]
  bail: false, // [boolean]
  moduleFileExtensions: ['js', 'jsx', 'ts'],
  moduleNameMapper: {
    '.+\\.(css|styl|less|sass|scss|ttf|woff|woff2)$': 'identity-obj-proxy',
    '\\.(png|svg|pdf|jpg|jpeg)$': '<rootDir>/fileMock.js',
  },
  // testURL: 'http://app_demo.classwallet.com',
  testURL: 'https://app-dev.classwallet.com',
  transform: { '^.+\\.jsx?$': 'babel-jest' },
  collectCoverageFrom: [],
  resetModules: true,
  verbose: true, // [boolean]
  moduleDirectories: ['node_modules', 'src'],
  setupFiles: ["./documentMock.js"],
  setupFilesAfterEnv: ['./jest.setup.js', './setupEnzyme.js'],
};
