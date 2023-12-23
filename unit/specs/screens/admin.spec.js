import FloatDisplayPrecision from '../../../src/admin/components/FloatDisplayPrecision';
import React, {useState} from 'react';
import {configure, mount} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

configure({adapter: new Adapter()});

const FloatDisplayPrecision1 = (props) => {
    const [floatSettings, setFloatSettings] = useState([]);
    const [fields, setFields] = useState([]);

    return (
      <span>3434</span>
    );
}

describe('admin', () => {
    it('FloatPrecision', () => {
        let state = {
            collectionName: 'testCollection',
            config: {
                FloatDisplayPrecision: {
                    top_level_numeric_field: 6,
                    test_field: 2
                }
            },
            scheme: {
                fields: [
                    {name: 'CurrentState.top_level_numeric_field'},
                    {name: 'CurrentState.test_field'},
                ]
            }
        };
        let store, wrapper;
        wrapper = mount(<FloatDisplayPrecision
          collection={state.collectionName}
          config={state.config} scheme={state.scheme} updateConfg={(t) => {
            console.log(t)
        }}
          activeConfigurationField={''}
          onCollectionConfigurationSelect={() => {
                                               }}
          fields_list={[]} isTabEditorActive={true}
          SELECT_TYPE=''
                        />);
        expect(wrapper.find('div.float_field_row').length).toBe(2);

    });
});