import React, {useState, useEffect} from 'react';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,Input,
    SegmentGroup,
    Button,Select,Checkbox,
    TextArea
  } from 'semantic-ui-react';

const UserFunctions = (props)=>{
  const [list, setList] = useState([]);
  const [index, setIndex] = useState(null);
  const [conf, setConf] = useState(null);
  const [userFunction, setUserFunction] = useState(null);

  useEffect(()=>{
    setIndex(null);
    if(!props.user_functions){
      setList([]);
      setConf({
        allow_user_to_edit_function: true, on: true
      });
    }else{
      setList(props.user_functions.admin_approved_functions);
      setConf({
        allow_user_to_edit_function: props.user_functions.allow_user_to_edit_function!==undefined ? props.user_functions.allow_user_to_edit_function : true,
        on: props.user_functions.on!==undefined ? props.user_functions.on : true,
      });
    }
  },[props.collection, props.user_functions]);

  useEffect(()=>{
    if(index!==null && list[index]) setUserFunction(list[index]);
    else setUserFunction(null);
  },[index]);

  function setField(name, value){
    let uf = Object.assign({}, userFunction);
    uf[name] = value;
    setUserFunction(uf);
    let fs = list.slice(0);
    if(fs[index]) fs[index] = uf;
    else fs.push(uf);
    setList(fs);
  }

  function addFunction(){
    let fs = list.slice(0);
    fs.push({
     updated_field : "",
     update_logic: "",
     description : "",
     name : ""
    });
    setList(fs);
    setIndex(fs.length-1);
  }

  function save(){
    let data = Object.assign({}, conf);
    data['admin_approved_functions'] = list;
    let error = false;
    list.forEach((l, i)=>{
      if(error) return;
      const error_fields={name:'Name', update_logic: 'Function', updated_field: 'Updated field'};
      Object.keys(error_fields).forEach(error_field=>{
        if(error) return;
        if(!l[error_field] || (Array.isArray(l[error_field]) && l[error_field].length===0)){
          setIndex(i);
          error = `'${error_fields[error_field]}' Field must be populated`;
        }
      });
    }); 
    if(error){ 
        alert(error);
        return;
    }
    props.updateConfg({data:data, field:'user_functions', activeCollection:props.collection});
  }

  function removeFunction(){
    let fs = list.slice(0);
    fs.splice(index, 1);
    setIndex(null);
    setList(fs);
  }

  const fields = props.scheme ? props.scheme.fields.filter(f=>{
    if(f.types.length>0 && f.types[0].type==='array') return false;
    const ar = f.name.split('.');
    if(ar.length>2 && (ar[0]==='CurrentState' || ar[0]==='AuditState')) return true; else return false; 
  }).map(f=>f.name.replace('CurrentState.','').replace('AuditState.','').replace('.[].','.')).filter(f=>{ return f[f.length-1]!==']'}) : [];

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
            <Segment textAlign="center" style={{width:'100%'}}>User Functions</Segment>
            <Segment>
                <Grid relaxed='very' columns='equal'>
                    {conf && <React.Fragment> <GridRow>
                      <div style={{marginLeft:'53px'}}>                                            
                        <span className="names-column">Allow user to edit functions  </span>
                        <Checkbox checked={conf.allow_user_to_edit_function} onChange={(e, data)=>{setConf({...conf,allow_user_to_edit_function: data.checked})}} /> 
                      </div>
                    </GridRow>
                    <GridRow>
                      <div style={{marginLeft:'53px'}}>                                            
                        <span className="names-column">On  </span>
                        <Checkbox checked={conf.on} onChange={(e, data)=>{setConf({...conf,on: data.checked})}} /> 
                      </div>
                    </GridRow> </React.Fragment>}
                    <Grid.Column >
                    <div className="charts-container fields-list" data-qa="charts-fields">
                        {list.map((f,i)=>{
                            const t=<div data-qa={f.name} key={f.name+'key'+i} onClick={()=>setIndex(i)} className={index===i ? 'selected' : ''}  data-qa-empty={''}>{f.name}</div>
                            return t;
                        })}
                    </div>
                    </Grid.Column>
                    <Grid.Column width={9}>

                        {userFunction && 
                          <React.Fragment>
                            
                            <div className="validators-container values-list" data-qa="validators-values">
                                <div>                                            
                                  <span className="names-column">Name</span> 
                                  <Input value={userFunction.name} style={{width:'300px'}} onChange={(e, data)=>{setField( 'name', data.value)}} /> 
                                  <Button data-qa="remove-functions" onClick={()=>{removeFunction()}} style={{float:'right'}}>Remove function</Button>
                                </div>
                                <div>                                            
                                  <span className="names-column">Description</span>
                                  <Input value={userFunction.description} style={{width:'450px'}} onChange={(e, data)=>{setField( 'description', data.value)}} /> 
                                </div>
                                <div>                                            
                                  <span className="names-column">Updated Field</span>
                                  <Select style={{minWidth:'400px'}} search options={
                                      fields.map((item) => ({ text: item, value: item })) 
                                  } value={userFunction.updated_field} data-qa="field-name" onChange={(e, data)=>{setField( 'updated_field', data.value)}} className="values-column" />
                                  
                                </div>
                                <div>                                            
                                  <span style={{verticalAlign:'top'}} className="names-column">Update Logic</span>
                                  <TextArea style={{resize:'both', width:'450px', padding:'5px'}} value={userFunction.update_logic} onChange={(e, data)=>{setField('update_logic', data.value)}} /> 
                                </div>
                          </div>

                          </React.Fragment>
                        }
                        <Button data-qa="add-function" onClick={()=>{addFunction()}} style={{marginTop: '10px'}}>Add function</Button>
                    </Grid.Column>
                    <br />
                <GridRow style={{marginLeft:'30px'}}>
                    <Button data-qa="cancel-functions" onClick={()=>{setList(props.user_functions.admin_approved_functions);setIndex(null);}}>Cancel</Button>
                    <Button data-qa="save-functions" onClick={()=>{save()}} style={{marginLeft: '20px'}}>Save</Button>
                </GridRow>
                </Grid>
            </Segment>
        </SegmentGroup>}
    </React.Fragment>
    )
}


export default UserFunctions;