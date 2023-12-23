module.exports = {
    automock: false, // [boolean]
    bail: false, // [boolean]
    moduleFileExtensions: ['js', 'jsx'],
    moduleNameMapper: {
        '.+\\.(css|styl|less|sass|scss|png|svg|jpg|ttf|woff|woff2)$': 'identity-obj-proxy'
    },
    // testURL: 'http://app_demo.classwallet.com',
    testURL: 'https://app-dev.classwallet.com',
    transform: {'^.+\\.jsx?$': 'babel-jest'},
    collectCoverageFrom: [],
    resetModules: true,
    verbose: true, // [boolean]
    moduleDirectories: ['node_modules', 'src'],
    // setupFiles: ["./prepare-test-env"],
    setupFilesAfterEnv: ['./jest.setup.js', './setupEnzyme.js']
};