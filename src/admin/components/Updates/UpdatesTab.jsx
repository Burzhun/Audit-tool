import React, {useState, useEffect} from 'react';
import {
    Grid,GridRow,
    Segment,
    Dropdown,
    Button
  } from 'semantic-ui-react';
import GlobalUpdate from './GlobalUpdate';
import AutoUpdate from './AutoUpdate';
import CreatableSelect from 'react-select/creatable';

const UpdatesTab = (props)=>{
    const [type, setType] = useState(null);
    const [globalUpdates, setGlobalUpdates] = useState([]);
    const [autoUpdates, setAutoUpdates] = useState([]);
    const [manualOverwrites, setManualOverwrites] = useState([]);

    useEffect(()=>{
        setManualOverwrites(props.config.updates_manual_overwrite_fields);
        if(props.config.global_automatic_updates){
            setGlobalUpdates(props.config.global_automatic_updates);
            setAutoUpdates(props.config.update_logics);
        }
    },[props.config]);

    function addGlobalUpdate(){
        let updates = globalUpdates.slice(0);
        updates.push({
            matching_fields:[],
            updatable_fields:[],
            update_function:'',
            aggregation_pipeline:'',
            description:''
        });
        setGlobalUpdates(updates);
        return updates.length-1;
    }

    function addAutoUpdate(){
        let updates = autoUpdates.slice(0);
        updates.push({
            dependency_fields:[],
            update_logic:'',
            updated_field:''
        });
        setAutoUpdates(updates);
        return updates.length-1;
    }

    function saveOverwrites(){
        props.updateConfg({data:manualOverwrites, field:'updates_manual_overwrite_fields', activeCollection:props.collection});
    }

    const fields_list={global:'Global Updates', auto:'Auto Updates',overwrite:'Update Manual Overwrite Fields'};
    const fields = props.scheme ? props.scheme.fields.filter(f=>{
        if(f.types.length>0 && f.types[0].type==='array') return false;
        const ar = f.name.split('.');
        if(ar.length>1 && (ar[0]==='CurrentState' || ar[0]==='AuditState')) return true; else return false;
      }).map(f=>f.name.replace('CurrentState.','').replace('AuditState.','').replace('.[].','.')).filter(f=>{ return f[f.length-1]!==']'}) : [];
    return(
        <React.Fragment>
            
                <Grid className="dashboard">
                    <GridRow centered style={{marginTop:'20px'}}>
                        <Segment className="segment-dropdown">
                            <Dropdown
                            className="dropdown-main"
                            placeholder="Select Update Type"
                            selection
                            selectOnBlur={false}
                            options={
                                Object.keys(fields_list).map((item) => ({ text: fields_list[item], value: item }))
                            }
                            onChange={
                                (e, data) => {setType(data.value)}
                            }
                            />
                        </Segment>
                    </GridRow>
                </Grid>
                {type==='global' &&
                    <React.Fragment>
                        <GlobalUpdate user={props.user} addGlobalUpdate={addGlobalUpdate} scheme={props.scheme} fields={fields} collection={props.collection} updateConfg={props.updateConfg} updates={globalUpdates} />
                    </React.Fragment>
                }
                {type==='auto' &&
                    <React.Fragment>
                        <AutoUpdate user={props.user} addAutoUpdate={addAutoUpdate} scheme={props.scheme} fields={fields} collection={props.collection} updateConfg={props.updateConfg} updates={autoUpdates} />
                    </React.Fragment>
                }
                {type==='overwrite' &&
                    <React.Fragment>
                        <GridRow>
                            
                            <div style={{margin:'10px'}}>Manual Overwrite fields</div>
                            <div data-qa="manual_overwrite_fields" style={{display:'block', marginLeft:'10px', width:'100%'}}>
                                <CreatableSelect
                                    isMulti
                                    styles={{width:'300px'}}
                                    value={manualOverwrites.map((f)=>({value: f, label: f}))}
                                    onChange={(values,m)=>setManualOverwrites(values ? values.map(v=>v.label) : [])}
                                    options={fields.concat(manualOverwrites).map((f)=>({value: f, label: f}))}
                                />
                            </div>
                        </GridRow> <br />
                        <GridRow style={{marginLeft:'10px'}}>
                            <Button data-qa="cancel-validator" onClick={()=>{setManualOverwrites(props.config.updates_manual_overwrite_fields)}}>Cancel</Button>
                            <Button data-qa="save-validator" onClick={()=>{saveOverwrites()}} style={{marginLeft: '20px'}}>Save</Button>
                        </GridRow>
                    </React.Fragment>
                }
        </React.Fragment>
    );
}
export default UpdatesTab;
