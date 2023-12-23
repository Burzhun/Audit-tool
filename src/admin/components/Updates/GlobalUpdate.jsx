import React, {useState, useEffect} from 'react';
import {
    Grid,
    Segment,
    SegmentGroup,
    Input, TextArea,
    Button,GridRow,Dropdown,
    GridColumn, Checkbox
  } from 'semantic-ui-react';
import Editor from 'react-simple-code-editor';
//import JsonForm from '../jsonForm';
import  Prism from 'prismjs';
import './editor.scss';
import CreatableSelect from 'react-select/creatable';

const GlobalUpdate = (props)=>{
    const [index, setIndex] = useState(null);
    const [update, setUpdate] = useState(null);
    const [enabled, setEnabled] = useState(true);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [functionCode, setFunctionCode] = useState('');
    const [pipeline, setPipeline] = useState('');
    const [matchingFields, setMatchingFields] = useState([]);
    const [updatableFields, setUpdatablFields] = useState([]);

    useEffect(()=>{
        if(update){
            setFields();
        }
    },[update]);

    useEffect(()=>{
        if(props.updates[index]){
            setUpdate(props.updates[index]);
        }
    },[props.updates]);

    function setFields(){
        setMatchingFields(update.matching_fields);
        setUpdatablFields(update.updatable_fields);
        setFunctionCode(update.update_function);
        setPipeline(update.aggregation_pipeline);
        setDescription(update.description);
        setName(update.name ? update.name : '');
        setEnabled(update.enabled!==undefined ? update.enabled : true);
    }

    function save(){
        let error = false;
        try{
            var f = new Function(['CurrentState', 'aggr_result'],functionCode);
        }catch(error_value){
            error = error_value.toString() + " in pipeline function "+index;
        }
        if(error){
            alert(error);
            return;
        }
        let update = Object.assign({}, update);
        update['name'] = name;
        update['description'] = description;
        update['update_function'] = functionCode;
        update['aggregation_pipeline'] = pipeline;
        update['matching_fields'] = matchingFields;
        update['updatable_fields'] = updatableFields;
        update['enabled'] = enabled;
        const error_fields={name:'Name',description: 'Description', aggregation_pipeline:'Pipeline', matching_fields: 'Matching Fields', update_function: 'Update Function', updatable_fields: 'Updatable fields'};
        Object.keys(error_fields).forEach(error_field=>{
            if(error) return;
            if(!update[error_field] || (Array.isArray(update[error_field]) && update[error_field].length===0)){
                error = `'${error_fields[error_field]}' Field must be populated`;
            }
        })
        if(error){
            alert(error);
            return;
        }
        let new_updates = props.updates.slice(0);
        new_updates[index] = update
        props.updateConfg({data:new_updates, field:'global_automatic_updates', activeCollection:props.collection, user: props.user});
    }

    function deleteUpdate(){
        if(window.confirm('Are you sure you want do delete this global update?')){
            let new_updates = props.updates.slice(0);
            new_updates.splice(index, 1);
            props.updateConfg({data:new_updates, field:'global_automatic_updates', activeCollection:props.collection, user: props.user});
            setIndex(null);
            setUpdate(null);
        }
    }

    function addUpdate(){
        let i = props.addGlobalUpdate();
        setIndex(i);
    }

    function moveUpdate(new_index){
        let new_updates = props.updates.slice(0);
        new_updates.splice(new_index, 0, new_updates.splice(index, 1)[0]);
        props.updateConfg({data:new_updates, field:'global_automatic_updates', activeCollection:props.collection, user: props.user});
        setIndex(new_index);
    }

    function onSave() {
        const confirmed = window.confirm(`Warning!
You are about to change configuration in this collection.
Are you sure? This can have a very significant
impact on how the app and interprets data.`);

        if (!confirmed) {
            return;
        }

        save();
    }

    const fields = props.fields;
    return(
        <React.Fragment>
            <div>
                <Button onClick={addUpdate}>Create new Global Update</Button>
                <span>  Set new position </span>
                <Dropdown
                    placeholder=""
                    selectOnBlur={false}
                    value={null}
                    options={
                        props.updates.map((item, index) => ({ text: index+1, value: index }))
                    }
                    onChange={(e, data)=>{moveUpdate(data.value);}}
                />
            </div>
            <SegmentGroup>
                <Segment textAlign="center" style={{width:'100%'}}>
                    <div>Set Global Updates</div>
                    <Grid className="dashboard">
                        <GridColumn width={14}>
                        <GridRow>
                            <Dropdown
                                placeholder="Select Update"
                                style={{margin:'15px auto'}}
                                selection
                                selectOnBlur={false}
                                value={index}
                                options={
                                    props.updates.map((item, index) => ({ text: item.name ? item.name : 'Global Update '+(index+1), value: index }))
                                }
                                onChange={(e, data)=>{setIndex(data.value); setUpdate(props.updates[data.value])}}
                            />
                        </GridRow>
                        {update && <React.Fragment>
                            <div style={{textAlign:'left'}}>
                                Current update position: {index+1}
                            </div>
                            <GridRow>
                            
                                <div style={{margin:'10px'}}>Name</div> <br />
                                <Input data-qa="name" style={{minWidth:'600px', padding:'15px'}} onChange={(e, data)=>setName(data.value)} value={name} />
                            
                            </GridRow> <br />
                            <GridRow>
                                <span className="" style={{margin:'10px'}}>Enabled</span>
                                <span className="">
                                    <Checkbox style={{padding:'15px'}} onChange={(e, data)=>setEnabled(data.checked)} checked={enabled} />
                                </span>
                            </GridRow> <br />
                            <GridRow>
                            
                                <div style={{margin:'10px'}}>Description</div> <br />
                                <TextArea data-qa="description" style={{minWidth:'900px', padding:'15px'}} onChange={(e, data)=>setDescription(data.value)} value={description} />
                            
                            </GridRow><br />
                            <GridRow>
                            
                                <div style={{margin:'10px'}}>Matching fields</div>
                                <div data-qa="matching_fields" style={{display:'block', marginLeft:'10px', width:'100%'}}>
                                <CreatableSelect
                                    isMulti
                                    styles={{width:'300px'}}
                                    value={matchingFields.map((f)=>({value: f, label: f}))}
                                    onChange={(values,m)=>setMatchingFields(values ? values.map(v=>v.label) : [])}
                                    options={fields.map((f)=>({value: f, label: f}))}
                                />
                                </div>
                            </GridRow><br />
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
                            </GridRow>
                            <GridRow>
                            
                                <div style={{margin:'10px'}}>Updatable fields</div>
                                <div data-qa="updatable_fields" style={{display:'block', marginLeft:'10px', width:'100%'}}>
                                    <CreatableSelect
                                        isMulti
                                        styles={{width:'300px'}}
                                        value={updatableFields.map((f)=>({value: f, label: f}))}
                                        onChange={(values,m)=>setUpdatablFields(values ? values.map(v=>v.label) : [])}
                                        options={fields.map((f)=>({value: f, label: f}))}
                                    />
                                </div>
                            </GridRow> <br />
                             <GridRow>
                                <div style={{margin:'10px'}}>Update Function</div>
                                <div className={'editor_container'}>
                                    <Editor
                                    value={functionCode}
                                    data-qa="function"
                                    onValueChange={code => setFunctionCode(code)}
                                    highlight={code => Prism.highlight(code, Prism.languages.javascript)}
                                    padding={10}
                                    style={{
                                        fontFamily: '"Fira code", "Fira Mono", monospace',
                                        fontSize: 12,
                                        margin:'10px'
                                    }}
                                    />
                                </div>
                            </GridRow> <br />
                            
                            <GridRow style={{marginLeft:'10px'}}>
                                <Button data-qa="cancel-validator" onClick={()=>{setFields()}}>Cancel</Button>
                                <Button data-qa="save-validator" onClick={onSave} style={{marginLeft: '20px'}}>Save</Button>
                                <Button data-qa="delete-validator" onClick={()=>{deleteUpdate()}} style={{marginLeft: '20px'}}>Delete</Button>
                            </GridRow>
                            
                            </React.Fragment>}
                        </GridColumn>
                    </Grid>
                </Segment>
            </SegmentGroup>
        </React.Fragment>
    );
}
export default GlobalUpdate;
