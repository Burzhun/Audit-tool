import React, {useState, useEffect} from 'react';
import {
    GridRow,
    TextArea,
    Checkbox
  } from 'semantic-ui-react';
import SortableMultiSelect from '../SortableMultiSelect';


const LabelForm = (props)=>{
    const [label, setLabel] = useState(null);
    const [type, setType] = useState('');

    useEffect(()=>{
        if(props.label!==undefined){
            setType(typeof props.label==='string' ? '' : 'complex')
            setLabel(JSON.parse(JSON.stringify(props.label)));
        }
    },[props.label]);

    function setLabelField(name, value){
        let new_label = Object.assign({}, label);
        new_label[name] = value;
        setLabel(new_label);
        props.setUpperChartField('LegendLabelField',new_label)
    }

    function changeType(complex){
        setType(complex ? 'complex' : '');
        if(complex){
            if(typeof props.label==='string'){
                setLabel({Formatting:'', Fields:[]});
            }else setLabel(props.label);
        }else{
            if(typeof props.label==='string')
                setLabel(props.label);
            else setLabel('');

        }
    }
    if(label===null) return null;
    return (
        <React.Fragment>        
        { type==='' ? 
            <GridRow>
                <div style={{margin:'10px',fontWeight:'bold'}}>LegendLabelField</div> <Checkbox style={{top:'12px',left:'10px'}} label="Complex type" checked={false} onChange={()=>changeType(true)} /> <br />
                <div style={{display:'block', marginLeft:'10px', width:'100%'}}>
                    <TextArea
                        style={{width:'600px',resize:'both'}}
                        value={label}
                        rows={1}
                        onChange={(e, data)=>props.setUpperChartField('LegendLabelField',data.value)}
                    />
                </div>
            </GridRow> 
        : 
            <GridRow>                
                <div style={{margin:'10px',fontWeight:'bold'}}>Label Input Fields</div> <Checkbox style={{top:'12px',left:'10px'}} label="Complex type" checked={true} onChange={()=>changeType(false)} /> <br />
                <div style={{display:'block', marginLeft:'10px', width:'100%'}}> 
                    <SortableMultiSelect
                            isMulti={true}
                            className=""
                            styles={{width:'600px'}}
                            value={label.Fields.map((f)=>({value: f, label: f}))}
                            onChange={(values,m)=>setLabelField('Fields',values ? values.map(v=>v.label) : [])}
                            options={props.fields.map((f)=>({value: f, label: f}))}
                        />
                    </div><br />
                <div style={{margin:'10px',fontWeight:'bold'}}>Label Formatting</div><br />
                <div style={{display:'block', marginLeft:'10px', width:'100%'}}>
                    <TextArea
                        style={{width:'600px', resize:'both'}}
                        value={label.Formatting}
                        onChange={(e, data)=>setLabelField('Formatting',data.value)}
                    />
                </div> 
            </GridRow>
        }        
        </React.Fragment>
    );
}

export default LabelForm;