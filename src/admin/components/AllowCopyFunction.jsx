import React, {useState, useEffect} from 'react';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,
    SegmentGroup,
    Button,Checkbox
  } from 'semantic-ui-react';

const AllowCopyFunction=(props)=>{
    const [allow, setAllow] = useState(false);

    useEffect(()=>{
        setFields();
    },[props.config]);

    function setFields(){
        if(props.config.AllowCopyFunction) setAllow(props.config.AllowCopyFunction);
    }

    function save(){
        props.updateConfg({data:allow, field:'AllowCopyFunction', activeCollection:props.collection});
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
                <Segment>
                    <Grid relaxed='very' columns='equal'>
                        <Grid.Column >
                            <GridRow>                                
                                <span className="score-names-column">AllowCopyFunction</span>
                                <span className="scoretext_column">
                                    <Checkbox style={{minWidth:'600px'}} onChange={(e, data)=>setAllow(data.checked)} checked={allow} />
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

export default AllowCopyFunction;