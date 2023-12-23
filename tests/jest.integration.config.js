module.exports = {
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.jsx?$",
    verbose: true,
    // read dotenv config and set up custom timeout
    setupFilesAfterEnv: ["./jest.setup.js"],
    testResultsProcessor: "jest-junit",
    testEnvironment: "./env.test.api.js"
    // transform: {"^.+\\.js$": "babel-jest",},
}