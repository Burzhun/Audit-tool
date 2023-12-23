const NodeEnvironment = require('jest-environment-jsdom');
const {getBrowserDriver} = require("@fxc/ui-test-framework");
const dotenv = require('dotenv');
const superagent = require('superagent');
const browserstack = require('browserstack-local');
const local = new browserstack.Local();
dotenv.config();
const webdriver = require('selenium-webdriver');

const width = process.env.BROWSER_WIDTH ? process.env.BROWSER_WIDTH : 1920;
const height = process.env.BROWSER_HEIGHT ? process.env.BROWSER_HEIGHT : 1080;

const capabilities = {
    project: 'jest-selenium-browserstack-example',
    browserName: process.env.BROWSER ? process.env.BROWSER : "chrome",
    os: 'Windows',
    os_version: 10,
    'browserstack.local': true,
    // 'browserstack.debug': true,
    'browserstack.user': process.env.BROWSERSTACK_USER,
    'browserstack.key': process.env.BROWSERSTACK_KEY,
    resolution: `${width}x${height}`
};

if (capabilities.browserName === 'chrome') {
    capabilities["goog:loggingPrefs"] = {"performance": "ALL"}
}
const BrowserStackLocalArgs = {
    key: capabilities['browserstack.key'],
    // verbose: true,
    onlyAutomate: true,
    folder: __dirname,
};

const start = async () =>
    new Promise((resolve, reject) => {
        local.start(BrowserStackLocalArgs, error => {
            if (error) {
                reject(error);
            }
            resolve();
        });
    });

const stop = async () =>
    new Promise((resolve, reject) => {
        local.stop(function (error) {
            if (error) {
                reject(error);
            }

            resolve();
        });
    });


const screen = {
    width,
    height
};

const agent = superagent.agent();


class ExpressEnvironment extends NodeEnvironment {
    constructor(config, context) {
        super(config, context);
    }

    async setup() {
        await super.setup();
        this.global.TextDecoder = require("util").TextDecoder;
        this.global.TextEncoder = require("util").TextEncoder;
        console.log(`This is hub: ${process.env.HUB_HOST}`)
        console.log(`This is hub_usage: ${process.env.IS_HUB}`)
        try {

            if (parseInt(process.env.IS_HUB) === 2) {
                await start();
            }
            const builder = parseInt(process.env.IS_HUB) === 2 ? new webdriver.Builder()
                .usingServer('http://hub-cloud.browserstack.com/wd/hub')
                .withCapabilities(capabilities)
                .build() : getBrowserDriver();
            this.global.driver = await builder;
            const login = await agent.post(`${process.env.BASE_URL}:4000/auth/login`).send({
                email: process.env.DV_USER,
                password: process.env.DV_PSWD
            });
            this.global.agent = agent;
            await this.global.driver.manage().window().setRect(screen);
            await builder.get(process.env.BASE_URL);
            await builder.executeScript(
                "localStorage.setItem(arguments[0], arguments[1])", 'jwtToken', login.body.token
            );
            await this.global.driver.manage().addCookie({name: 'jwtToken', value: login.body.token});
            await this.global.driver.manage().addCookie({name: 'token', value: login.body.token});
            await builder.navigate().refresh();
            const browser = await builder.getCapabilities();
            this.global.browserName = browser.get('browserName');
        } catch (e) {
            console.log(e);
        }
    }

    async teardown() {
        if (parseInt(process.env.IS_HUB) === 2) {
            await stop();
        }
        await this.global.driver.quit();
        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }
}

module.exports = ExpressEnvironment;