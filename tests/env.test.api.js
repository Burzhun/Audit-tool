const NodeEnvironment = require('jest-environment-jsdom');
const dotenv = require('dotenv');

dotenv.config();

const supertest = require('supertest');
const app = require('../server');
const agent = supertest(app);

class ExpressEnvironment extends NodeEnvironment {

    async setup() {
        this.global.TextDecoder = require("util").TextDecoder;
        this.global.TextEncoder = require("util").TextEncoder;
        try {
            const login = await agent.post('/auth/login').send({
                email: process.env.DV_USER,
                password: process.env.DV_PSWD
            });
            this.global.cookies = {'Cookie': "token=" + login.body.token};
            this.global.agent = agent;
        } catch (e) {
            console.log('This is error: ', e)
        }

    }

    async teardown() {
        await super.teardown();
    }

    runScript(script) {
        return super.runScript(script);
    }
}

module.exports = ExpressEnvironment;