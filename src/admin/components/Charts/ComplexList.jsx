import React, {useState, useEffect} from 'react';
import {
    Grid,GridRow,
    Input,
    Select
  } from 'semantic-ui-react';
import SortableMultiSelect from '../SortableMultiSelect';


const ComplexList = (props)=>{
  const [selectedField, setSelectedField] = useState(null);
  const [selectedFieldValue, setSelectedFieldValue] = useState(null);
  const [fieldsList, setFieldslist] = useState(null);

  useEffect(()=>{
    if(props.data){
      const new_data = props.data.map(field=>{
        if(typeof field==='string'){
          return {
            field : field,
            operator : "equals",
            value : "this",
            secondValue: ''
        }
        }else return field;
      })
        setFieldslist(new_data);
        if(selectedField)
          setSelectedFieldValue(new_data.find(f2=>f2.field===selectedField))
    }
  },[props.data]);

  function setValues(values){
    const new_fields = values.map(field=>{
      const f2 = fieldsList.find(f=>f.field===field);
      if(f2){
        return f2;
      }else{
        return {
          field : field,
          operator : "equals", 
          value : "this",
          secondValue: ''
        }
      }
    });
    props.setUpperChartField('DefaultSearchFieldsOnMiniSearchResultsScreen', new_fields);
  }

  function setFieldProperty(name, value){
    let new_value = selectedFieldValue;
    new_value[name] = value;
    setSelectedFieldValue(new_value);
    let new_list = fieldsList.slice(0);
    const i = new_list.findIndex(f=>f.field===new_value.field);
    new_list[i] = new_value;
    props.setUpperChartField('DefaultSearchFieldsOnMiniSearchResultsScreen', new_list);
    
  }

  if(fieldsList===null) return null;
  return (
    <GridRow>
      <div style={{margin:'10px', fontWeight:'bold' }}>DefaultSearchFieldsOnMiniSearchResultsScreen</div> <br />
      <div style={{display:'block', marginLeft:'10px', width:'100%'}}>
        <SortableMultiSelect
          isMulti={true}
          className=""
          styles={{width:'300px'}}
          value={fieldsList.map((f)=>({value: f.field, label: f.field}))}
          onChange={(values,m)=>setValues(values ? values.map(v=>v.label) : [])}
          options={props.fields.map((f)=>({value: f, label: f}))}
        />
      </div>
      <Grid.Column >
        <div style={{margin:'10px', fontWeight:'bold'}}>Default search values</div>
        <div className="charts-container fields-list" style={{marginLeft:'10px', marginTop:'5px'}} data-qa="charts-fields">
            {fieldsList.map((f,index)=>{
                const t=<div data-qa={f.field} key={f.field+'key'+index} onClick={()=>{setSelectedField(f.field);setSelectedFieldValue(fieldsList.find(f2=>f2.field===f.field))}} className={selectedField===f.field ? 'selected' : ''}  data-qa-empty={''}>{f.field}</div>
                return t;
            })}
        </div>
      </Grid.Column>
      {selectedFieldValue && <Grid.Column width={9}>
        <div className="charts-container values-list" style={{margin:'5px'}}>
          <div>                                            
            <span className="names-column">Operator</span>
            <Select  style={{minWidth:'400px'}} search options={
                ['equals', 'greater', 'less', 'between'].map((item) => ({ text: item, value: item })) 
            } value={selectedFieldValue.operator} data-qa="field-name" onChange={(e, data)=>{setFieldProperty('operator', data.value)}} className="values-column" />
          </div>
          <div>                                            
            <span className="names-column">Value</span>
            <Input data-qa="data-type" style={{minWidth:'400px'}} value={selectedFieldValue.value} onChange={(e, data)=>{setFieldProperty('value', data.value)}} className="values-column" />
          </div>
          <div>                                            
            <span className="names-column">Second value</span>
            <Input data-qa="data-type" style={{minWidth:'400px'}} value={selectedFieldValue.secondValue} onChange={(e, data)=>{setFieldProperty('secondValue', data.value)}} className="values-column" />
          </div>
        </div>
      </Grid.Column>}
    </GridRow> 
  )
}

export default ComplexList;