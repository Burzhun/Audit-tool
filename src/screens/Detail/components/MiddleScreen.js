import React from 'react';
import { Button } from 'semantic-ui-react';

export default class MiddleScreen extends React.Component {
  prepareFiled(value) {
    if (value === true) { return 'True'; }
    if (value === false) { return 'False'; }
    return value;
  }

  render() {
    const { data } = this.props;
    const fields = this.props.fields.map((field, i) => {
      if (data[field]) {
        return (
          <div className="middle_field" key={`middle_field${i}`}>
            <b>{field}</b>
            <div className="divider" />
            <span>{this.prepareFiled(data[field])}</span>
          </div>
        );
      }
      if (data.CurrentState[field] !== null && !Array.isArray(data.CurrentState[field])) {
        return (
          <div className="middle_field" key={`middle_field${i}`}>
            <b>{field}</b>
            <div className="divider" />
            <span>{this.prepareFiled(data.CurrentState[field])}</span>
          </div>
        );
      }
      return null;
    });
    return (
      <span>
        <div style={{ margin: '10px 5px', overflow: 'hidden' }}>
          <Button onClick={this.props.hideFileds} style={{ float: 'right' }}>Hide fields</Button>
        </div>
        {fields}
      </span>
    );
  }
}
