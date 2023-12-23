import React, { Component } from 'react';

import { Select } from 'semantic-ui-react';

import 'semantic-ui-css/semantic.min.css';
import './index.scss';

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default class ConfigSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      configs: [],
    };
  }

  componentDidMount() {
    this.props.getConfigs();
  }

	setConfig = (config) => {
	  localStorage.setItem('config_name', config);
	  this.props.updateConfig(config);
	}

	// Render
	render() {
	  const options = [<option key="0"> </option>];
	  this.props.configs.map((config, i) => {
	    options.push({ key: 1 + i, text: config, value: config });
	    return config;
	  });
	  return (
  <>
    {this.props.configs.length
      ? (
        <div>
          {' '}
          <span style={{position:'relative', top:'10px', verticalAlign:'top'}}>Select dataset</span>
          <Select
            search
            style={{ marginLeft: '20px' }}
            onChange={(el) => this.setConfig(el.target.textContent)}
            options={options}
            data-qa="collection-name"
            value={this.props.collectionName}
          />
        </div>
      )
      : (this.props.no_configs_found ? (<span>Datasets not found</span>) : (<span> Loading ...</span>))}
  </>
	  );
	}
}
