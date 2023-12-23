import React, {useState, useEffect} from 'react';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,
    SegmentGroup,
    Button
  } from 'semantic-ui-react';
import CreatableSelect from 'react-select/creatable';

const ComplexFieldsform = (props)=>{
    const [origFields, setOrigFields] = useState([]);
    const [fields, setFields] = useState([]);
  
    useEffect(()=>{
        setData();
    },[props.config]);

    function setData(){
        let fields1 = props.scheme ? props.scheme.fields.filter(f=>{
            if((!f.types.length>0 || f.types[0].type!=='array') || f.level!==1) return false;
            return f.name.split('.').length==2;
          }).map(f=>f.name.replace('CurrentState.','').replace('AuditState.','')) : [];
        if(props.config.ComplexFields){
            fields1 = [...new Set(fields1.concat(props.config.ComplexFields))];
            setFields(props.config.ComplexFields);
        } 
        setOrigFields(fields1);
    }

    function save(){
        props.updateConfg({data:fields, field:'ComplexFields', activeCollection:props.collection});
    }

    
    return (
        <React.Fragment>
        <Grid className="dashboard">
            <GridRow centered>
                <GridColumn width={7}>
                <Segment className="segment-dropdown">
                    <Dropdown
                    className="dropdown-main"
                    placeholder="Select Config Field..."
                    data-qa="select-config-field"
                    fluid
                    search
                    selection
                    selectOnBlur={false}
                    options={
                        props.fields_list.map((item) => ({ text: item, value: item }))
                      }
                      onChange={
                        (e, data) => props.onCollectionConfigurationSelect(
                          props.SELECT_TYPE,
                          data,
                        )
                      }
                      value={props.activeConfigurationField}
                    />
                </Segment>
                </GridColumn>
            </GridRow>
        </Grid>
        {props.isTabEditorActive && <SegmentGroup>
        <Segment textAlign="center" style={{width:'100%'}}>Set DefaultSearchFieldName</Segment>
            <Segment>
                <Grid relaxed='very' columns='equal'>
                    <Grid.Column >
                        <GridRow>
                        
                            <span className="score-names-column">DefaultSearchFieldName</span>
                            <div style={{display:'block', marginLeft:'10px', minWidth:'200px'}}>
                                {/* <Dropdown
                                    placeholder="Select Field"
                                    style={{margin:'15px auto'}} 
                                    selection
                                    search
                                    selectOnBlur={false}
                                    value={name}
                                    options={ 
                                        fields.map((item, index) => ({ text: item, value: item }))
                                    }
                                    onChange={(e, data)=>{setName(data.value);}}
                                /> */}
                                <CreatableSelect
                                    isMulti
                                    className=""
                                    styles={{width:'300px'}}
                                    value={fields.map((f)=>({value: f, label: f}))}
                                    onChange={(values,m)=>setFields(values ? values.map(v=>v.label) : [])}
                                    options={[...new Set(fields.concat(origFields))].map((f)=>({value: f, label: f}))}
                                />
                            </div>                         
                        </GridRow><br />
                    </Grid.Column>
                    <br />
                <GridRow style={{marginLeft:'30px'}}>
                    <Button data-qa="cancel-validator" onClick={()=>{setData()}}>Cancel</Button>
                    <Button data-qa="save-validator" onClick={()=>{save()}} style={{marginLeft: '20px'}}>Save</Button>
                </GridRow>
                </Grid>
            </Segment>
        </SegmentGroup>}
    </React.Fragment>
    )
  }
  
export default  ComplexFieldsform;