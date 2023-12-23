import React, {useState, useEffect} from 'react';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,
    SegmentGroup,Input,
    Button,Select
  } from 'semantic-ui-react';

const FloatDisplayPrecision=(props)=>{
    const [floatSettings, setFloatSettings] = useState([]);
    const [fields, setFields] = useState([]);

    useEffect(()=>{
        setData();
    },[props.config]);

    function setData(){
        if(props.scheme){
            const num_fields = props.config.Validators ? props.config.Validators.filter(v=>v.type && v.type==='numeric').map(v=>v.name) : [];
            setFields(props.scheme.fields.filter(f=>{
                const name = f.name;
                if(name.startsWith('CurrentState.') && !name.endsWith('.[]')) return true;
            }).map(f=>f.name.replace(/\.\[\]/g,'').replace('CurrentState.','')).filter(f=>num_fields.includes(f)))
        }
        if(props.config.FloatDisplayPrecision) setFloatSettings(props.config.FloatDisplayPrecision.map(t=>{
            return {key: t.name, value: t.value};
        }));
    }

    function setFloatKey(index, key){
        let settings = floatSettings.slice(0);
        settings[index].key = key;
        setFloatSettings(settings);
    }

    function setFloatValue(index, value){
        if(value>10 || value<0) return;
        let settings = floatSettings.slice(0);
        settings[index].value = parseInt(value);
        setFloatSettings(settings);
    }

    function addSetting(){
        let settings = floatSettings.slice(0);
        settings.push({key:'', value:0});
        setFloatSettings(settings);
    }

    function deleteSetting(index){
        let settings = floatSettings.slice(0);
        settings.splice(index,1);
        setFloatSettings(settings);
    }

    function save(){
        let data = [];
        let error = '';
        floatSettings.forEach(item=>{
            if(item.key && (item.value || item.value===0)) data.push({name: item.key, value: item.value})
            else error = 'Field and value must be set';
        });
        if(error) alert(error);
        else props.updateConfg({data:data, field:'FloatDisplayPrecision', activeCollection:props.collection});
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
            <Segment textAlign="center" style={{width:'100%'}}>Set Confidence Scores</Segment>
                <Segment >
                    <Grid centered={true} relaxed='very' columns='equal'>
                        <GridColumn style={{justifyContent:'center',maxWidth:'500px'}}>
                            <GridRow centered={true} style={{justifyContent:'space-between'}}> 
                                <span style={{display:'flex'}}>Field Name</span>
                                <span style={{display:'flex'}}>Digit after decimal</span>
                            </GridRow>
                            {floatSettings.map((item,index)=>(
                                <React.Fragment key={'float_setting'+index}>
                                <GridRow className="float_field_row" centered={true} style={{justifyContent:'space-between'}}> 
                                    <Select
                                        search
                                        style={{maxWidth:'280px'}}
                                        className='float-field-selector'
                                        options={fields.map((f)=>({value: f, text: f}))}
                                        value={item.key.replace(/\.\[\]/g,'').replace('CurrentState.','')}
                                        onChange={(e,data)=>{setFloatKey(index, data.value)}}

                                    />
                                    <Input className='float-input-field' type='number' onChange={(e,data)=>{setFloatValue(index, data.value)}} value={item.value} />
                                    <Button onClick={()=>deleteSetting(index)} style={{position:'absolute', right:'-100px'}}>Remove</Button>
                                </GridRow>
                                <br />
                                </React.Fragment>
                            ))}
                            <Button className='add-floatprecision' data-qa="add-floatprecision" onClick={()=>{addSetting()}}>Add Field</Button>
                        <br />
                        </GridColumn>
                    <GridRow centered={true} style={{marginLeft:'30px'}}>
                        <Button className='cancel-floatprecision' data-qa="cancel-floatprecision" onClick={()=>{setData()}}>Cancel</Button>
                        <Button className='save-floatprecision' data-qa="save-floatprecision" onClick={()=>{save()}} style={{marginLeft: '20px'}}>Save</Button>
                    </GridRow>
                    </Grid>
                </Segment>
            </SegmentGroup>}
        </React.Fragment>
    );
};

export default FloatDisplayPrecision;