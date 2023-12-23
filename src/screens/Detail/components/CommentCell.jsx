import React from 'react';
import PropTypes from 'prop-types'
import {Input, Table} from "semantic-ui-react";
import CustomPopup from "./CustomPopup";


export default class CommentCell extends React.Component {
  static propTypes = {
    fieldName: PropTypes.string.isRequired,
    changedValues: PropTypes.object.isRequired,
    disabled: PropTypes.bool.isRequired,
    setComment: PropTypes.func.isRequired,
  };
  	constructor(props) {
		super(props);
		this.state = {
			value: '',
		}
	}

  componentDidUpdate(prevProps, prevState, snapshot) {
	if (prevProps.previousAudit !== this.props.previousAudit) {
		this.setState({value:''})
	}
}

  render() {
    return (            
			<Table.Cell style={{width:this.props.width}}>
				<React.Fragment>
					<CustomPopup
						text={this.props.value}
						element_id={'input_field_comment'+this.props.fieldName}
					>
					<Input
					className='fieldInput'
					value={this.state.value}
					onBlur={()=>{document.element_to_focus=null;}}
					id={'input_field_comment'+this.props.fieldName}
					disabled={this.props.disabled}
					onChange={(e, data) => {this.setState({value: data.value});this.props.setComment(this.props.fieldName, data.value)}}
					/>
					</CustomPopup>
				</React.Fragment>
		</Table.Cell>
    )
  }
}
