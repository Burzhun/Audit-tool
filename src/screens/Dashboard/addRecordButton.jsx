import React from 'react';
import PropTypes from 'prop-types'
import { Button } from 'semantic-ui-react';


export default class AddRecordButton extends React.PureComponent {
  static propTypes = {
    config: PropTypes.object.isRequired,
    collectionName: PropTypes.string.isRequired,
    user: PropTypes.string.isRequired,
    addRecord: PropTypes.func.isRequired,
  }

  render() {
    const {config, collectionName, user} = this.props;
    let addButton = '';
    if (config && config.AllowNewRecordCreation && config.NewRecordFields) {
        addButton = (
            <Button
              onClick={() => this.props.addRecord(config.NewRecordFields, collectionName, user)}
              className={'addFieldButton'}
            >
              Add Record
            </Button>
        )
    }
    return addButton
  }
}
