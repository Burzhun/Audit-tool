import React, {useState, useEffect} from 'react';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,
    SegmentGroup,
    Button,Checkbox,
  } from 'semantic-ui-react';

const TableSettings=(props)=>{
    const [selectedField, setSelectedField] = useState('');
    const [settings, setSettings] = useState(null);

    useEffect(()=>{
        setSelectedField('');
        setSettings(null);
        getFieldsList();
    },[props.config]);

    useEffect(()=>{
        setData();
    },[selectedField]);

    function setData(){
        if(props.config.TableSettings){
            const t = props.config.TableSettings.find(f=>f.name===selectedField);
            if(t) setSettings(t);
            else setSettings({
                name: selectedField,
                add: true,
                remove: true
            });
        }else{
            setSettings({
                name: selectedField,
                add: true,
                remove: true
            });
        }
    }

    function getFieldsList(){
        if(props.scheme){
            var populated_fields = Array.isArray(props.config.TableSettings) ? props.config.TableSettings.map(s=>s.name) : [];
            props.scheme.fields.forEach(field=>{
                const ar = field.name.split('.');                
                if(ar.length>2 && ar[0]==='CurrentState' && ar[2]==='[]'){
                    let field_name = null;
                    if(ar.length===5 && ar[4]==='[]' && field.types && field.types.find(t=>t.type==='array' || t.type==='object')){
                        field_name = ar[1]+'.'+ar[3];
                    }
                    if(ar.length===3 && ar[2]==='[]' && field.types.find(t=>t.type==='array' || t.type==='object')){
                        if(props.config.ComplexFields && props.config.ComplexFields.includes(ar[1])) return;
                        field_name = ar[1];
                    }
                    if(field_name){
                        if(!list.includes(field_name)) list.push(field_name);
                        if(!populated_fields.includes(field_name)){ empty_list.push(field_name); }
                    }
                }
            });
        }
    }

    function setSubFieldsList(){
        subfields_list=[];
        if(props.scheme){
            const ar2 = selectedField.split('.');
            props.scheme.fields.forEach(field=>{
                const ar = field.name.split('.');
                if(ar.length==4 && ar[0]==='CurrentState' && ar[1]===selectedField && ar[2]==='[]'){
                    if(ar[3]!=='_id' && !subfields_list.includes(ar[3]))
                        subfields_list.push(ar[3])
                }
                if(ar.length===6 && ar[0]==='CurrentState' && ar[1]===ar2[0] && ar[3]===ar2[1]){
                    if(ar[6]!=='_id' && !subfields_list.includes(ar[5]))
                        subfields_list.push(ar[5])
                }
            });
        }
    }



    function save(){
        let new_data=[];
        if(props.config.TableSettings){
            new_data = props.config.TableSettings.slice(0);
            const i = props.config.TableSettings.findIndex(f=>f.name===selectedField);
            if(i>-1){
                new_data[i] = settings;
            }else{
                new_data.push(settings);
            }
        }else{
            new_data = [settings];
        }
        props.updateConfg({data:new_data, field:'TableSettings', activeCollection:props.collection});
    }

    
      

    var empty_list=[];
    let list=[];
    var subfields_list=[];
    getFieldsList();
    setSubFieldsList();

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
                <Segment textAlign="center" style={{width:'100%'}}>Enable Adding and Removing rows in table</Segment>
                <Segment>
                    <Grid relaxed='very' columns='equal'>
                        <Grid.Column >
                        <div className="charts-container fields-list" data-qa="charts-fields">
                            {list.map((name,index)=>{
                                const t=<div data-qa={name} key={name+'key'+index} onClick={()=>setSelectedField(name)} className={selectedField===name ? 'selected' : (empty_list.includes(name) ? 'empty' : '')}  data-qa-empty={''}>{name}</div>
                                return t;
                            })}
                        </div>
                        </Grid.Column>
                        <Grid.Column width={9}>

                            {selectedField && settings &&
                                <div className="validators-container values-list" data-qa="validators-values">
                                    <div>                                           
                                        <span style={{verticalAlign:'top'}} className="names-column">Add rows</span>
                                        <Checkbox checked={settings.add} onChange={(e, data)=>{setSettings(Object.assign({...settings}, {add: data.checked})) }} /> 
                                    </div>
                                    <div>                                           
                                        <span style={{verticalAlign:'top'}} className="names-column">Remove rows </span>
                                        <Checkbox checked={settings.remove} onChange={(e, data)=>{setSettings(Object.assign({...settings}, {remove: data.checked})) }} /> 
                                    </div>
                                </div>
                            }
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

export default TableSettings;