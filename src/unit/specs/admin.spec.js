import React, { useState, useEffect } from 'react';
import { mount, shallow, configure } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { Select } from 'semantic-ui-react';
import ValidatorsForm from '../../admin/components/ValidatorsForm';
import FloatDisplayPrecision from '../../admin/components/FloatDisplayPrecision';
import { act } from 'react-dom/test-utils';
import { deleteOne } from '../../../server/models/configSchema';

configure({ adapter: new Adapter() });

function delay(delayInms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}


describe('admin', () => {
  it('FloatPrecision', () => {
    const state = {
      collectionName: 'testCollection',
      config: {
        FloatDisplayPrecision: [
          { name: 'top_level_numeric_field', value: 6 },
          { name: 'test_field', value: 2 },
        ],
        Validators: [
          { name: 'top_level_numeric_field', type: 'numeric' },
          { name: 'test_field', type: 'numeric' },
          { name: 'test_field2', type: 'numeric' },
        ],
      },
      scheme: {
        fields: [
          { name: 'CurrentState.top_level_numeric_field' },
          { name: 'CurrentState.test_field' },
          { name: 'CurrentState.test_field2' },
        ],
      },

    };
    let store; let
      wrapper;
    wrapper = mount(<FloatDisplayPrecision
      collection={state.collectionName}
      config={state.config}
      scheme={state.scheme}
      updateConfg={(t) => { state.config.FloatDisplayPrecision = t.data; }}
      activeConfigurationField=""
      onCollectionConfigurationSelect={() => {}}
      fields_list={[]}
      isTabEditorActive
      SELECT_TYPE=""
    />);
    expect(wrapper.find('div.float_field_row').length).toBe(2);
    wrapper.find('button.add-floatprecision').simulate('click');
    expect(wrapper.find('div.float_field_row').length).toBe(3);
    wrapper.find('button.cancel-floatprecision').simulate('click');
    expect(wrapper.find('div.float_field_row').length).toBe(2);

    wrapper.find('button.add-floatprecision').simulate('click');
    wrapper.find('div.float-field-selector').last().simulate('click');
    wrapper.find('div.float-field-selector').last().find('div.menu div.item').last()
      .simulate('click');
    expect(wrapper.find('div.float_field_row').length).toBe(3);
    wrapper.find('div.float-input-field input').last().simulate('change', { target: { value: 4 } });
    wrapper.find('div.float-input-field input').last().simulate('change', { target: { value: 34344 } });
    wrapper.find('button.save-floatprecision').simulate('click');
    expect(state.config.FloatDisplayPrecision.find((f) => f.name === 'test_field2').value).toBe(4);
  });

  it('Validators', async (done) => {
    const state = {
      collectionName: 'testCollection',
      config: {
        Validators: [
          {
            type: 'enumerate_array',
            constraints: {
              multiple: true,
              nullable: false,
              values: [
                'US',
                'GB',
              ],
            },
            name: 'Countries to',
          },
          {
            type: 'numeric_array',
            constraints: {
            },
            name: 'score',
          },
          {
            type: 'text_array',
            constraints: {
            },
            name: 'text1',
          },
        ],
        update_logics: [],
        global_automatic_updates: [],
        ComplexFields: ['fees'],
      },
      scheme: {
        fields: [
          {
            name: 'CurrentState.Countries to',
            level: 1,
            count: 1,
            types: [
              {
                type: 'string',
                count: 2,
              },
              {
                type: 'array',
                count: 24,
              },
            ],
          },
          {
            name: 'CurrentState.score',
            level: 1,
            count: 1,
            types: [
              {
                type: 'int',
                count: 22,
              },
            ],
          },
          {
            name: 'CurrentState.text1',
            level: 1,
            count: 1,
            types: [
              {
                type: 'string',
                count: 87,
              },
            ],
          },
        ],
      },
    };
    let store; let
      wrapper;
    wrapper = mount(<ValidatorsForm
      collection="testCollection"
      config={state.config}
      scheme={state.scheme}
      updateConfg={(t) => { console.log(t); }}
    />);

    expect(wrapper.find('div.validators-container.fields-list .validator_item').length).toBe(3);
    wrapper.find('div.validators-container.fields-list .validator_item').at(0).simulate('click');
    expect(wrapper.find('div.validators-container.values-list .values-column').first().text()).toBe('Countries to');
    const el = wrapper.find('div.validators-container.values-list .constraint_row').filterWhere((e) => e.find('.validator_constraints_key_values').length > 0);
    global.alert = jest.fn();
    if (el) {
      el.first().find('button.validator-remove-button').simulate('click');
    }
    wrapper.find('div.validators-container.values-list button.save_validator_button').simulate('click');
    expect(global.alert).toHaveBeenCalledTimes(1);

    // check numeric array constraints
    wrapper.find('div.validators-container.fields-list .validator_item').at(1).simulate('click');
    wrapper.find('div.validators-container.values-list button.add_constraint_button').simulate('click');
    let options = wrapper.find('.constraint_row').first().find(Select).first()
      .props().options.map((t) => t.text);
    expect(options.length).toBe(7);
    expect(options).toContain('positive');
    expect(options).toContain('gt');
    expect(options).not.toContain('pattern');
    expect(wrapper.find('table.validator_datatypes_table tr td').at(1).text()).toBe('22');

    // check text array constraints
    wrapper.find('div.validators-container.fields-list .validator_item').at(2).simulate('click');
    wrapper.find('div.validators-container.values-list button.add_constraint_button').simulate('click');
    options = wrapper.find('.constraint_row').first().find(Select).first()
      .props().options.map((t) => t.text);
    expect(options.length).toBe(5);
    expect(options).not.toContain('positive');
    expect(options).toContain('maxLength');
    expect(options).toContain('pattern');
    expect(wrapper.find('table.validator_datatypes_table tr td').at(1).text()).toBe('87');
    console.log(wrapper.find('.datatype_row').find(Select).length);
    global.confirm = jest.fn();

    // check that there is confirm window after changing datatype
    await act(async () => {
      wrapper.find('.datatype_row').find(Select).props().onChange(null, { value: 'text', name: 'text' });   
      await delay(500);   
      wrapper.find('div.validators-container.values-list button.save_validator_button').simulate('click');
      expect(global.confirm).toHaveBeenCalledTimes(1);

    });
    done();
  });
});
