import React, { useState } from 'react';
import { configure, mount, shallow } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import mongodb from 'mongodb';
import CreatableSelect from 'react-select/creatable';
import UserPanel from '../../admin/UserPanel/UserPanel';
import { act } from 'react-dom/test-utils';

// import axios from 'axios';

configure({ adapter: new Adapter() });

let wrapper = null;
function delay(delayInms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}

function waitForAttribute(query) {
  return new Promise((resolve, reject) => {
    const tryInterval = 100; // try every 100ms
    const maxTries = 20; // try 10 times
    let currentTry = 0;

    const timer = setInterval(() => {
      if (currentTry >= maxTries) {
        clearInterval(timer);
        return reject(new Error(`${query} not found on ${wrapper.debug()}`));
      }
      wrapper.update();
      const prop = wrapper.find(query);
      console.log(prop.length);

      if (prop.length) {
        clearInterval(timer);
        resolve();
      }
      currentTry++;
    }, tryInterval);
  });
}

const wait = () => new Promise((resolve) => setTimeout(resolve));

describe('users', () => {
  let users = [];

  beforeAll(() => new Promise((resolve) => {
    // axios.post(`/database/getRecord`,{collectionName: "FxFeesTest-v0.3",value: "19"}).then(data=>{
    //     console.log(data);
    // })
    (async () => {
      // console.log(process.env);
      // resolve();
      // return;
      const db = await mongodb.MongoClient.connect(process.env.db_creds, { useNewUrlParser: true, useUnifiedTopology: true });
      const dbo = db.db(process.env.DB_NAME);
      users = await dbo.collection('User').find({ role: 'external' }).toArray();

      resolve();
    })();

    setTimeout(() => {
      resolve();
    }, 10000);
  }));

  it('UsersPanel', async (done) => {
    const state = {
      collectionName: 'testCollection',
      config: {
        FloatDisplayPrecision: {
          top_level_numeric_field: 6,
          test_field: 2,
        },
      },
      scheme: {
        fields: [
          { name: 'CurrentState.top_level_numeric_field' },
          { name: 'CurrentState.test_field' },
        ],
      },
    };
    global.fetch = require('node-fetch');
    // global.fetch = (u,d)=>{
    //     f1(u,d);
    //     console.log(3242342342342342424);
    // }
    let store;
    delete global.localStorage;
    global.localStorage = {
      jwtToken: 'unit_test_token',
    };
    wrapper = mount(<UserPanel test={true} />);
    wrapper.update();

    expect(wrapper.find('div.column div.menu.ui a').length).toBe(2);
    // wrapper.
    await act(async () => {
      wrapper.find('div.column div.menu.ui a').at(0).simulate('click');
      await delay(500);
      wrapper.update();
    });
    await delay(1500);

    //await waitForAttribute('div.user_row');

    expect(wrapper.find('div.column div.fields-list div').length).toBe(users.length);

    const i = users.findIndex((t) => t.AccessableCollections && t.AccessableCollections.length);
    await act(async () => {
      wrapper.find('div.column div.fields-list div').at(i).simulate('click');
    await delay(500);
    wrapper.update();
    });

    expect(wrapper.find(CreatableSelect).props().value[0].label).toBe(users[i].AccessableCollections[0]);

    done();
  });
});
