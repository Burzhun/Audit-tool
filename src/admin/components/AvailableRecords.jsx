import React, {useState, useEffect} from 'react';
import CreatableSelect from 'react-select/creatable';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,
    SegmentGroup,
    Button,Checkbox
  } from 'semantic-ui-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

let headers = {
	'Accept': 'application/json',
	'Content-Type': 'application/json',
	'x-access-token': localStorage.jwtToken,
	host:window.location.hostname
};

const AvailableRecords=(props)=>{
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [accessibleRecords, setAccessibleRecords] = useState({});
    useEffect(()=>{
        getUsersList();
        if(props.config.AccessibleRecords) setAccessibleRecords(props.config.AccessibleRecords);
    },[props.config]);

    function getUsersList(){
        fetch(BACKEND_URL + '/auth/externalUsers', {
            method: 'GET',
            headers: headers            
        }).then(response => {
            return response.json();
        }).then(data=>{
            if(data.users) setUsers(data.users);
        });
    }

    function setRecords(records){
        const conf = {...accessibleRecords};
        conf[selectedUser.RegisteredUserEmail] = records.filter(r=>!isNaN(r)).map(r=>parseInt(r));
        setAccessibleRecords(conf);
    }

    function setAll(accessAll){
        const conf = JSON.parse(JSON.stringify(accessibleRecords));
        if(!conf[selectedUser.RegisteredUserEmail]) conf[selectedUser.RegisteredUserEmail] = [];
        if(accessAll){
            if(!conf[selectedUser.RegisteredUserEmail].includes('all')) conf[selectedUser.RegisteredUserEmail].push('all')
        }else{
            if(conf[selectedUser.RegisteredUserEmail].includes('all')) conf[selectedUser.RegisteredUserEmail] = conf[selectedUser.RegisteredUserEmail].filter(f=>f!=='all')
        }
        setAccessibleRecords(conf);
    }

    function cancel(){

    }

    

    function save(){
        props.updateConfg({data:accessibleRecords, field:'AccessibleRecords', activeCollection:props.collection});
    }

    const recordIds = selectedUser && accessibleRecords[selectedUser.RegisteredUserEmail] || [];
    const accessAll = selectedUser && accessibleRecords[selectedUser.RegisteredUserEmail] && accessibleRecords[selectedUser.RegisteredUserEmail].includes('all') || false;


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
            <Segment textAlign="center" style={{width:'100%'}}>Set Available Records</Segment>
                <Segment>
                    <Grid relaxed='very' columns='equal'>
                        <Grid.Column >
                            <div className="validators-container fields-list" data-qa="external-users-list">
                                {users.map(user=>(<div key={user._id} onClick={()=>setSelectedUser(user)} className={selectedUser && selectedUser.RegisteredUserEmail===user.RegisteredUserEmail ? 'selected' : ''}>
                                    {user.RegisteredUserEmail}
                                </div>))}
                            </div>
                        </Grid.Column>
                        <Grid.Column width={9}>
                            {selectedUser && <div className="validators-container values-list" data-qa="validators-values">
                                <div><span style={{verticalAlign:'top'}}>All records are accessible </span><Checkbox checked={accessAll} onChange={(e,data)=>{setAll(data.checked)}} /></div>
                                <div>Records that can opened by users</div>
                                <CreatableSelect
                                    isMulti
                                    isDisabled={accessAll}
                                    className=""
                                    styles={{width:'300px'}}
                                    value={recordIds.filter(f=>f!=='all').map((f)=>({value: f.toString(), label: f.toString()}))}
                                    onChange={(values,m)=>setRecords(values ? values.map(v=>v.label) : [])}
                                    options={[]}
                                />
                            </div>}
                        </Grid.Column>
                        
                        <GridRow style={{marginLeft:'30px'}}>
                            <Button data-qa="cancel-validator" onClick={()=>{cancel()}}>Cancel</Button>
                            <Button data-qa="save-validator" onClick={()=>{save()}} style={{marginLeft: '20px'}}>Save</Button>
                        </GridRow>
                    </Grid>
                </Segment>
            </SegmentGroup>}
        </React.Fragment>
    );
};

export default AvailableRecords;