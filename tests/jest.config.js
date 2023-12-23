module.exports = {
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$",
    verbose: true,
    // read dotenv config and set up custom timeout
    setupFilesAfterEnv: ["./jest.setup.js", "./setupFilesAfterEnv.js"],
    testResultsProcessor: "jest-junit",
    testEnvironment: "./env.test.ui.js",
    transform: {"^.+\\.js$": "babel-jest",},
    testRunner: 'jest-jasmine2'
}