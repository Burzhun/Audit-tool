import React, {useState} from 'react';
import {Table, Button, Select, Popup, Icon} from "semantic-ui-react";
import 'semantic-ui-css/semantic.min.css';
import _ from 'lodash';
import ArrayRowEdit from "./ArrayRowEdit";
import DoubleScrollbar from 'react-double-scrollbar';
import ResizableBox from './../../../components/resizableBox/ResizableBox';
import ArrayRowFilter from './ArrayRowFilter';
import TransformationModal from './TransformationModal';
import validate from '../../../lib/validators';
import TableRow from "./Row";
import ArrayRow from "./ArrayRow";

export default function ComplexField(props){
    const [fields, setFields] = useState([]);

    useEffect(()=>{
      
    })
    
    function getRowData(field){
        let rowData = {value: props.data.CurrentState[field], name: field};
        rowData['valid'] = 0;
        if (Object.keys(this.state.validity).includes(field) && Object.keys(props.changedValues).includes(field)){
          rowData['valid'] = this.state.validity[field]
        }
        return rowData
      }

    return (
        <React.Fragment>
            {fields.map((field, index)=>(
                !Array.isArray(props.data.CurrentState[field]) ? <TableRow
                key={`audit-row-${field}`}
                rowData={this.getRowData(field)}
                config={props.config}
                previousAudit={props.previousAudit}
                changedValues={props.changedValues}
                errors={props.errors}
                setTableFieldSize={this.setTableFieldSize}
              // ref_prop={provided.innerRef}
                sizes={props.sizes}
                show_upward={false}
                setNewValue={props.setNewValue} 
                setComment={props.setComment}
                setValidity={this.setValidity}
                removeField={()=>props.removeField(index)}
                auto_field={props.auto_fields.includes(field)}
              /> :  <ArrayRow
                      data={props.data.CurrentState[field]}
                      key={`audit-row-${field}`}
                      chart_context={props.chart_context}
                      drag_provided={props.drag_provided}
                      config={props.config}
                      changedValues={props.changedValues}
                      addNewArrayRecord={props.addNewArrayRecord}
                      previousAudit={props.previousAudit}
                      errors={props.errors}
                      setArrayComment={props.setArrayComment}
                      removeField={()=>props.removeField(index)}
                      validity={this.state.validity}
                      setNewArrayValue={props.setNewArrayValue}
                      unsetArrayValue={props.unsetArrayValue}
                      setChangedValues={props.setChangedValues}
                      setArrayValueValidity={this.setArrayValueValidity}
                      fieldName={field}
                  />
            
            ))}
        </React.Fragment>
    )


};