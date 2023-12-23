import React, {useState, useEffect} from 'react';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,
    SegmentGroup,
    Button
  } from 'semantic-ui-react';

const SearchFieldNameForm = (props)=>{
    const [name, setName] = useState('');
  
    useEffect(()=>{
        const s = props.config.DefaultSearchFieldName ? props.config.DefaultSearchFieldName : ''
        setName(s.indexOf('.')>0 ? s.split('.')[1] : s);
    },[props.config]);

    function save(){
        const field_name = props.scheme.fields.find(f=>(f.name===name || f.name.includes('.'+name)) && f.name.split('.').length<3).name;
        props.updateConfg({data:field_name, field:'DefaultSearchFieldName', activeCollection:props.collection});
    }

    const fields = props.scheme ? props.scheme.fields.filter(f=>{
        if(f.types.length>0 && (f.types[0].type==='array' || f.types[0].type==='object')) return false;
        return f.name.split('.').length<3;
      }).map(f=>f.name.replace('CurrentState.','').replace('AuditState.','')) : [];
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
                            <span className="scoretext_column">
                                <Dropdown
                                    placeholder="Select Field"
                                    selection
                                    search
                                    selectOnBlur={false}
                                    value={name}
                                    options={ 
                                        fields.map((item, index) => ({ text: item, value: item }))
                                    }
                                    onChange={(e, data)=>{setName(data.value);}}
                                />
                            </span>                         
                        </GridRow><br />
                    </Grid.Column>
                    <br />
                <GridRow style={{marginLeft:'30px'}}>
                    <Button data-qa="cancel-validator" onClick={()=>{setName(props.config.DefaultSearchFieldName ? props.config.DefaultSearchFieldName : '')}}>Cancel</Button>
                    <Button data-qa="save-validator" onClick={()=>{save()}} style={{marginLeft: '20px'}}>Save</Button>
                </GridRow>
                </Grid>
            </Segment>
        </SegmentGroup>}
    </React.Fragment>
    )
  }
  
export default  SearchFieldNameForm