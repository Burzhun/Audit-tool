import React, {useState, useEffect} from 'react';
import { useSelector } from 'react-redux';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,
    SegmentGroup,
    Button,Checkbox
  } from 'semantic-ui-react';
  import Editor from 'react-simple-code-editor';
  //import JsonForm from '../jsonForm';
  import  Prism from 'prismjs';
  import './Updates/editor.scss';
import formatDate from '../../utils/formatDate';
import dashboardSlice from '../../admin/store/dashboard/slice';

const ExternalUsersQuery=(props)=>{
    const [pipeline, setPipeline] = useState('');
  const {user_type: userType} = useSelector(state => state[dashboardSlice.name]);

    useEffect(()=>{
        setFields();
    },[props.config]);

    function setFields(){
        if(props.config.ExternalUsersQuery && props.config.ExternalUsersQuery.pipeline) setPipeline(props.config.ExternalUsersQuery.pipeline);
    }

    function save(){
      if (userType === 'external') {
        const confirmed = window.confirm(`Warning!
You are about to change configuration in this collection.
Are you sure? This can have a very significant
impact on how the app and interprets data.`);
    
        if (!confirmed) {
          return;
        }
      }

      props.updateConfg({data:{pipeline:pipeline}, field:'ExternalUsersQuery', activeCollection:props.collection});
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
            <Segment textAlign="center" style={{width:'100%'}}>Set Pipeline for External Users</Segment>
                <Segment>
                    <Grid relaxed='very' columns='equal'>
                        <Grid.Column >
                            <GridRow>
                                <div style={{margin:'10px'}}>Pipeline</div>
                                <div className={'editor_container'}>
                                    <Editor
                                    value={pipeline}
                                    data-qa="pipeline"
                                    onValueChange={code => setPipeline(code)}
                                    highlight={code => Prism.highlight(code, Prism.languages.javascript)}
                                    padding={10}
                                    style={{
                                        fontFamily: '"Fira code", "Fira Mono", monospace',
                                        fontSize: 12,
                                        margin:'10px'
                                    }}
                                    />
                                    
                                </div>
                                <span style={{marginLeft:'40px'}}>
                                    <div>Variables that you can use</div>
                                    <div>{'{first_name}'}</div>
                                    <div>{'{last_name}'}</div>
                                    <div>{'{full_name}'}</div>
                                    <div>{'{email}'}</div>
                                </span>
                            </GridRow> <br />
                        </Grid.Column>
                        <br />
                    <GridRow style={{marginLeft:'30px'}}>
                        <Button data-qa="cancel-validator" onClick={()=>{setFields()}}>Cancel</Button>
                        <Button data-qa="save-validator" onClick={()=>{save()}} style={{marginLeft: '20px'}}>Save</Button>
                    </GridRow>
                    </Grid>
                </Segment>
            </SegmentGroup>}
        </React.Fragment>
    );
};

export default ExternalUsersQuery;
