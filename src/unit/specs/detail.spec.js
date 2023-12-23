import React, { useState, useEffect } from 'react';
import { mount, shallow, configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { Select, Input } from 'semantic-ui-react';
import mongodb from 'mongodb';
import axios from 'axios';
import LeftPanel from '../../screens/Detail/components/LeftPanel';
import AuditTable from '../../screens/Detail/components/AuditTable';
import TableRow from '../../screens/Detail/components/Row';

configure({ adapter: new Adapter() });
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;
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
let datasets_list = ['FxFeesTest-v0.3','FxPricing', 'FxRatesWB','FxStableFees','ResearcherDirectory','ServiceActiveWB','wb_fx_rates_fees_collection_trackingV3'];
describe('detail', () => {
  const data = {};
  let records=[]; let
    configs=[];
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
      for(const dataset of datasets_list){
        const record = await dbo.collection(dataset).findOne({});
        const config = await dbo.collection('configurations').findOne({ CollectionRelevantFor: dataset });
        if(record && config){
          records.push(record);
          configs.push(config);
        }

      }
      

      resolve();
    })();

    setTimeout(() => {
      resolve();
    }, 10000);
  }));

  it('Collpase_tables', () => {
    let store; 
    let new_config = Object.assign({},configs[0]);
    const record = records[0];
    new_config.AuditDropdownVisible = false;
    wrapper = mount(<LeftPanel
      data={[record]}
      config={new_config}
      RecordId={record.RecordId.toString()}
      collectionName={new_config.CollectionRelevantFor}
      user={{
        user_id: 10, first_name: 'burzhun', last_name: 'burzhunov', email: 'burzhun@gmail.com', role: 'Admin', iat: 1618407782, exp: new Date().getTime() + 100000,
      }}
      isAuthenticated
      history={{}}
      saveData={(data) => { console.log(data); }}
      getConfig={() => {}}
      getDataByFirmID={() => {}}
      copyRecord={(r) => {}}
      show_fields_button={false}
      isUpdating={false}
      testing
      show_fields={() => {}}
    />,{ attachTo: window.domNode });
    const fees_objects_number = record.CurrentState.fees.length;
    expect(wrapper.find('span.left_collapse_button').length).toBe(2 + fees_objects_number);
    wrapper.find('span.left_collapse_button').at(1).find('img').simulate('click');
    expect(wrapper.find('span.left_collapse_button').length).toBe(2);
    expect(wrapper.find('div.collapsed_nested_table').length).toBe(0);
    wrapper.find('span.left_collapse_button').at(1).find('img').simulate('click');
    wrapper.find('span.left_collapse_button').at(2).find('img').simulate('click');
    expect(wrapper.find('span.left_collapse_button').length).toBe(1 + fees_objects_number);
    expect(wrapper.find('div.collapsed_nested_table').length).toBe(1);

    expect(wrapper.find('span.object_filters').length).toBe(1);
    expect(wrapper.find('td.valid_selector').length).toBe(0);

  });

  
  

  it('Check_inputs', async (done) => {
    let store;
    global.matchMedia = global.matchMedia || function () {
      return {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      };
    }; 
    window.alert = () => {}; 
    const consoleSpy = jest.spyOn(console, 'error');
    for(var index=0; index<records.length; index++){
      const record = records[index];
      const config = configs[index];
      const div = document.createElement('div');
      window.domNode = div;
      document.body.appendChild(div);

      wrapper = mount(<LeftPanel
        data={[record]}
        config={config}
        RecordId={record.RecordId.toString()}
        collectionName={config.CollectionRelevantFor}
        user={{
          user_id: 10, first_name: 'burzhun', last_name: 'burzhunov', email: 'burzhun@gmail.com', role: 'Admin', iat: 1618407782, exp: new Date().getTime() + 100000,
        }}
        isAuthenticated
        history={{}}
        saveData={(data) => { console.log(data); }}
        getConfig={() => {}}
        getDataByFirmID={() => {}}
        copyRecord={(r) => {}}
        show_fields_button={false}
        isUpdating={false}
        testing
        show_fields={() => {}}
      />,{ attachTo: window.domNode });
     
  
      let row = null;
      const rows = wrapper.find(TableRow);
      for(var i=0;i<rows.length; i++){
        row = rows.at(i);
        if(row.state().dataType!=='text' || !row.find(Select).length || !row.state().editable) continue;
        
        row.find(Select).at(0).prop('onChange')(null,{value: 2});
        wrapper.update();
        row.update();
        //await waitForAttribute('div.user_row');
        await delay(1000);
        wrapper.update();
  
        row = wrapper.find(TableRow).at(i);
        const pr = row.find(Input).at(0);
        row.find(Input).at(0).prop('onFocus')();
        wrapper.update();
        await delay(1000);
        
        expect(consoleSpy).toHaveBeenCalledTimes(0);
      }
    }
      
    
    
    
    
    done();
    });

});
