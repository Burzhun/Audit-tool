import request from 'superagent';
import {WebClient} from '@slack/web-api';

const agent = request.agent();
const client = new WebClient(process.env.SLACK_TOKEN);

// Post a message to a channel your app is in using ID and message text
export async function publishSlackMessage(id, sendText, whom, isGroup = true, botName = 'QA issues') {
    try {
        const notifyWhom = isGroup ? `!subteam^${whom}` : `@${whom}`;
        const text = `<${notifyWhom}> ${sendText}`;
        // Call the chat.postMessage method using the built-in WebClient
        const result = await client.chat.postMessage({
            // The token you used to initialize your app
            token: process.env.SLACK_TOKEN,
            channel: id,
            text,
            icon_url: 'https://img.icons8.com/cute-clipart/2x/test-passed.png',
            username: botName,
        });
    } catch (error) {
        console.log(error);
    }
}

export async function getELKLogs() {
    let login;
    try {
        login = await agent.post(`https://${process.env.ELK_URL}/api/v1/auth/login`).send({
            username: process.env.ELK_USER,
            password: process.env.ELK_PSWD
        }).set('kbn-xsrf', true).set('kbn-name', 'kibana');
        console.log(login)
    } catch (err) {
        console.log(err)
    }


    const headers = {
        'Content-Type': 'application/json',
        'kbn-xsrf': true,
        'kbn-name': 'kibana'
    }
    const params = {
        'version': true, 'size': 500, 'sort': [{'@timestamp': {'order': 'desc'}}], 'query': {
            'bool': {
                'must': [], 'filter': [
                    {
                        'bool': {
                            'should': [{'match': {'application_stack': process.env.KIBANA_SOURCE}}],
                            'minimum_should_match': 1
                        }
                    },
                    {'range': {'audit_timestamp': {'gte': '2021-03-15 12:00:00'}}},
                    {'match_phrase': {'user': 'a1@getnada.com'}}], 'should': [], 'must_not': []
            }
        }
    }

    return agent.post(`https://${process.env.ELK_URL}/elasticsearch/logstash-*/_search?rest_total_hits_as_int=true&ignore_unavailable=true&ignore_throttled=true&preference=1597735807954&timeout=30000ms`).send(params);
}