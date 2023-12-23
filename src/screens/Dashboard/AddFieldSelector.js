import React from 'react';
import { Button, Select } from 'semantic-ui-react';

import 'semantic-ui-css/semantic.min.css';
import './index.scss';

const AddFieldSelector = (props) => {
  const options = props.add_options.length > 0 ? props.add_options.filter((f) => f.text !== 'ImageLinks') : [];

  return props.data.length > 0
    ? (
      <div
        className="chart_add_field_selector"
        style={{
          display: 'inline-block',
          float: 'right',
          marginRight: '40px',
          marginBottom: '10px',
        }}
      >
        <Select
          options={options}
          search
          onChange={(el, val) => {
            props.addState({ fieldToAdd: val.value });
          }}
          className="addSelect"
          data-qa="add-field"
          placeholder="Select field"
        />
        <Button data-qa="add-field-btn" onClick={props.addField} className="addFieldButton">Add field</Button>
      </div>
    )
    : <div />;
};

export default AddFieldSelector;
