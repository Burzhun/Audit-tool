import React from 'react';
import {Table} from "semantic-ui-react";
import AuditHeaderResizableBox from './../../../components/resizableBox/AuditHeaderResizableBox';

export default class TableHeader extends React.Component {
  constructor(props) {
    super(props);
    this.getResizableBox = this.getResizableBox.bind(this);
  }

  getResizableBox(field,text){
    return <AuditHeaderResizableBox setWidth={this.props.setWidth} width={this.props.sizes[field] ? this.props.sizes[field] : 150} field={field}>{text}</AuditHeaderResizableBox>
  }
  render() {
    const sizes = this.props.sizes;
    return (
      <Table.Header className="audit_table_header">
        <Table.Row>
          <Table.HeaderCell style={{textAlign:'justify',width:sizes['field'] ? sizes['field']+'px' : '150px'}}>{this.getResizableBox('field',' Field')}</Table.HeaderCell>
          <Table.HeaderCell style={{textAlign:'right',width:sizes['current'] ? sizes['current']+'px' : '150px'}}>{this.getResizableBox('current','Current Data')}</Table.HeaderCell>
          {this.props.AuditDropdownVisible!==false && <Table.HeaderCell style={{width:sizes['valid'] ? sizes['valid']+'px' : '150px'}}>{this.getResizableBox('valid','Valid(Yes/No)')}</Table.HeaderCell>}
          <Table.HeaderCell style={{width:sizes['update'] ? sizes['update']+'px' : '150px'}}>{this.getResizableBox('update','Updated Data')}</Table.HeaderCell>
          <Table.HeaderCell style={{width:sizes['comment'] ? sizes['comment']+'px' : '150px'}}>{this.getResizableBox('comment','Comment')}</Table.HeaderCell>
          <Table.HeaderCell style={{width:sizes['audit_info'] ? sizes['audit_info']+'px' : '150px'}}>{this.getResizableBox('audit_info','Previous audit info')}</Table.HeaderCell>
        </Table.Row>
      </Table.Header>
    )
  }
}
