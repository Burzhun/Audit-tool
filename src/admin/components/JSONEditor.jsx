import React, {useState, useEffect} from 'react';
import { useSelector } from 'react-redux';
import { Form, TextArea, Button } from 'semantic-ui-react';
import formatDate from '../../utils/formatDate';
import dashboardSlice from '../../admin/store/dashboard/slice';

const JSONEditor=(props)=>{
    const [jsonText, setJsonText] = useState('');
    const {user_type: userType} = useSelector(state => state[dashboardSlice.name]);

    useEffect(()=>{
        const text = JSON.stringify(props.config, null, '\t');
        setJsonText(text);
        lines = text.split("\n")
    },[props.collection, props.config]);
    
    var lines = jsonText.split("\n");


    function save(){
        if(!isJson(jsonText)){
            alert("Incorrect configuration");
            return;
        }
        var data = JSON.parse(jsonText);

        props.updateConfg({data:data, field:'collection', activeCollection:props.collection});
    }

    function isJson(str) {
        if (typeof str !== 'string') return false;
        try {
            const result = JSON.parse(str);
            const type = Object.prototype.toString.call(result);
            return type === '[object Object]'
                || type === '[object Array]';
        } catch (err) {
            return false;
        }
    }

    return (
        <Form style={{marginBottom:'15px'}}>
            <div><Button onClick={()=>{save()}} className="green" style={{marginRight:'15px'}}>Save</Button> <Button onClick={()=>{setJsonText(JSON.stringify(props.config, null, '\t'))}}>Cancel</Button></div><br />
            <TextArea onChange={(e, data)=>setJsonText(data.value)} className="validator-json-textarea" value={jsonText} rows={lines.length} />
            <div><Button onClick={()=>{save()}} className="green" style={{marginRight:'15px'}}>Save</Button> <Button onClick={()=>{setJsonText(JSON.stringify(props.config, null, '\t'))}}>Cancel</Button></div><br />
        </Form>
    )
}

export default JSONEditor;
