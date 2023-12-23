import React, {useState} from 'react';
import {
    Input,
    Button
  } from 'semantic-ui-react';

const ConfigurationForm=(props)=>{
    const [name, setName] = useState('');

    function createConfiguration(){
        if(name){
            props.onCollectionConfigurationSelect(name);
        }
    }

    return (
        <div>
            <Input value={name} onChange={(e,data)=>setName(data.value)} style={{width:'300px'}} /> <Button onClick={()=>createConfiguration()}>Create Collection</Button>
        </div>
    )
}

export default ConfigurationForm;