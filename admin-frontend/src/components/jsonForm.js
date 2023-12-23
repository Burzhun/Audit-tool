import React, {useState, useEffect} from 'react';
import { Form, TextArea } from 'semantic-ui-react';

const JsonForm=(props)=>{
    const [jsonText, setJsonText] = useState('');

    useEffect(()=>{
        let data = Object.assign({}, props.data);
        delete data['name'];
        const text = JSON.stringify(data, null, '\t');
        setJsonText(text);
    },[props.data]);
    
    var lines = jsonText.split('\n'); 

    function setData(text){
        setJsonText(text)
        if(!isJson(text)) return;
        var data = JSON.parse(text);
        data['name'] = props.data.name;
        props.setCollection(data);
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
        <TextArea onChange={(e, data)=>setData(data.value)} className="validator_json_textarea" value={jsonText} rows={lines.length} />
      </Form>
    )
}

export default JsonForm;