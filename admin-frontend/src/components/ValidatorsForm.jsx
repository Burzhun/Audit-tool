import React, {useState, useEffect} from 'react';
import {
    Grid,
    Radio,
    Segment,
    SegmentGroup,
    Input,
    Button,
    Select
  } from 'semantic-ui-react';
import JsonForm from './jsonForm';

const ValidationForm = (props)=>{
    const [formType, setFormType] = useState('html');
    const [selectedField, setSelectedField] = useState('');
    const [filterField, setFilterField] = useState('');
    const [newfieldName, setNewFieldName] = useState('');
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [constraints, setConstraints] = useState([]);

    const dataTypes=['bool','numeric','text','enumerate','date','isodate'];
    

  


    useEffect(()=>{
        setSelectedField('');
        setNewFieldName('');        
        if(selectedCollection && selectedCollection.constraints){
            setConstraints(Object.keys(selectedCollection.constraints).sort().map(key=>{ return {key:key, value:selectedCollection.constraints[key]} }));            
        }
        setFieldsList();
    },[props.collection]);

    useEffect(()=>{
        setFormType('html');
        if(selectedCollection && selectedCollection.constraints){
            let constraints = Object.keys(selectedCollection.constraints).sort().map(key=>{ return {key:key, value:selectedCollection.constraints[key]} });
            if(selectedCollection['type']){
                const allowed_constraints = getConstraintValues(selectedCollection.type);
                constraints = constraints.filter(c=>allowed_constraints.includes(c['key']));
            }
            setConstraints(constraints);
        }
    },[selectedCollection]);

    useEffect(()=>{
        if(selectedField)
            setSelectedConfg(selectedField);
            setNewFieldName('');
    },[props.config]);

    function setFieldsList(){
        if(props.config.Validators){
            existing_fields = props.config.Validators.filter(f=>filterField==='' || f.name.toLowerCase().includes(filterField.toLowerCase())).map(f=>f.name);
        }
        try{
            fields = props.scheme.fields.filter(f=>{
                const ar = f.name.split('.');
                if(ar.length>1 && ar[0]==='CurrentState') return true; else return false;
            }).map(f=>f.name.replace('CurrentState.','').replace('.[].','.')).filter(f=>{ return f[f.length-1]!==']' && (!existing_fields || !existing_fields.includes(f))});
        }catch{
            fields=[];
        } 
    }

    function setSelectedConfg(field, is_new=false){        
        setSelectedField(field);
        if(!is_new) setNewFieldName('');
        if(field && props.config.Validators){
            const col = props.config.Validators.find(t=>t.name===field);
            if(col){
                setSelectedCollection(col);
                if(col.constraints)
                    setConstraints(Object.keys(col.constraints).sort().map(key=>{ return {key:key, value:col.constraints[key]} }))
                else
                    setConstraints([]);            
                    
            }else{
                if(field==='new_field'){
                    const new_validator ={"name":"","type":"text","constraints":{}}
                    setSelectedCollection(new_validator);                    
                }
                setConstraints([]);
            }
        }
    }

    function setDataType(type){
        let col = Object.assign({},selectedCollection);
        col['type'] = type;
        setSelectedCollection(col);
    }

    function setConstraintValue(value, index){
        let con = constraints.slice(0);
        con[index] = {key:con[index].key, value: value};
        setConstraints(con);
    }

    function setConstraintKey(key, index){
        let con = constraints.slice(0);
        con[index] = {key:key, value: con[index].value};
        setConstraints(con);
    }

    function constraintValue(key, value, index ){
        if(typeof value==='boolean' || ['multiple','positive','negative', 'lt_now', 'nullable'].includes(key))
            return <Select placeholder="Select value" data-qa="constraint-value" value={value} options={[{text:'true', value:true}, {text:'false', value:false}]} onChange={(e,data)=>{setConstraintValue(data.value, index)}} />;
        return Array.isArray(value) ? 
                <Input onChange={(e)=>setConstraintValue(e.target.value.split(','), index) } value={value.join(',')} /> :
                <Input onChange={(e)=>setConstraintValue(e.target.value, index)} value={value} />; 
    }
    
    function removeConstraint(index){
        let con = constraints.slice(0,index);
        let con2 = constraints.slice(index+1);
        setConstraints(con.concat(con2));

    }

    function addConstraint(){
        let con = constraints.slice(0);
        con.push({key:'',value:''}); 
        setConstraints(con)
    }

    function getConstraintValues(type){
        switch(type){
            case 'enumerate':
                return ['multiple','values'];
                break;
            case 'numeric':
                return ['gte','lte','nullable','positive'];
                break;
            case 'text':
                return ['maxLength','pattern'];
                break;
            case 'isodate':
                return ['lt_now','nullable'];
                break;
            case 'date':
                return ['gte','lte'];
                break;
            case 'bool':
                return ['nullable'];
                break;
            case 'url':
                return [];
                break;
        }
    }

    function save(){
        let con = {};
        constraints.forEach(el=>{
            con[el.key] = el.value;
        });
        let col = Object.assign({},selectedCollection);
        col['constraints'] = con;
        if(newfieldName) col['name'] = newfieldName;
        if(col['name'] === ''){
            alert('You need to set field name');
            return;
        }
        setSelectedCollection(col);
        props.updateConfg({data:col, field:'Validators',activeCollection:props.collection, is_new: newfieldName!='',  is_delete: false});
    }

    function deleteValidator(){
        if(window.confirm('Do you want to delete this validator?'))
            props.updateConfg({data:selectedCollection, field:'Validators',activeCollection:props.collection, is_new: newfieldName!='', is_delete: true});
    }

    
    let fields=[];
    let existing_fields=[];
    setFieldsList();
    
    return(
        <React.Fragment>
            
            <SegmentGroup>
                <Segment textAlign="center" style={{width:'100%'}}>Set Validators For Fields</Segment>
                <Segment>
                    <Grid relaxed='very' columns='equal'>
                            <Grid.Column >
                                <Input placeholder="Filter Fields" onChange={(e)=>setFilterField(e.target.value)} className="validator_fields_filter" />
                                <div className="validators_container fields_list" data-qa="validators-fields">
                                    {existing_fields.map((name,index)=>{
                                        return <div key={name+'key'+index} className={selectedField===name ? 'selected': ''} data-qa={name} onClick={()=>setSelectedConfg(name)}>{name}</div>
                                    })}
                                </div>
                                <div className="validators_container">
                                    <Button onClick={()=>setSelectedConfg('new_field', true)}>Add Field</Button>
                                </div>
                            </Grid.Column>
                            <Grid.Column width={9}>

                                {selectedField &&
                                    <div className="validators_container values_list" data-qa="validators-values">
                                        <div>
                                            
                                            <span className="names_column">Field Name</span>
                                            {selectedField==='new_field' ? 
                                                <Select style={{minWidth:'400px'}} search options={
                                                    fields.map((item) => ({ text: item, value: item })) 
                                                } value={newfieldName} data-qa="field-name" searchQuery={newfieldName} onChange={(e, data)=>{setNewFieldName(data.value)}} onSearchChange={(e, data)=>{setNewFieldName(data.searchQuery)}} className="values_column" /> :
                                                <span className="values_column">{selectedField}</span>
                                            }
                                        </div>
                                        <span className="json_toggle"><Radio data-qa="to-json" checked={formType==='json'} onChange={(e,data)=>{setFormType(data.checked ? 'json' : 'html')}} toggle /> <span>JSON</span> </span>
                                        {formType==='html' ?
                                        <React.Fragment>
                                            <div>
                                                <span className="names_column">Datatype</span>
                                                <Select
                                                    data-qa="data-type"
                                                    className="values_column"
                                                    options={
                                                        dataTypes.map((item) => ({ text: item, value: item }))
                                                    }
                                                    onChange={(e,data)=>{setDataType(data.value)}}
                                                    value={selectedCollection.type}
                                                />
                                            </div>
                                            {selectedCollection['DisplayDropDown']!==undefined && <div>
                                                <span className="names_column">DisplayDropDown</span>
                                                <Select
                                                    className="values_column"
                                                    options={[{text:'true', value:true}, {text:'false', value:false}]}
                                                    onChange={(e,data)=>{setSelectedCollection({...selectedCollection, DisplayDropDown: data.value})}}
                                                    value={selectedCollection['DisplayDropDown']}
                                                />
                                            </div>}
                                            {constraints.length>0 && constraints.map((con, index)=>{
                                                return (<div key={'constraint_row'+index} >
                                                    <span className="names_column">Constraint {index+1}</span>
                                                    <span className="values_column">
                                                        <Select search options={
                                                        getConstraintValues(selectedCollection['type']).map((item) => ({ text: item, value: item })) 
                                                    } data-qa="constraint-name" value={con.key} searchQuery={con.key} onChange={(e, data)=>{setConstraintKey(data.value, index)}} onSearchChange={(e, data)=>{setConstraintKey(data.searchQuery, index)}} className="constraint_key" />
                                                        <span className="constraint_value" data-qa="constraint-value">
                                                            {constraintValue(con.key, con.value, index)}
                                                        </span>
                                                        <Button onClick={()=>removeConstraint(index)} className="validator_remove_button">Remove</Button>
                                                    </span>
                                                </div>)
                                            })}
                                            <div><Button onClick={()=>{addConstraint()}}>Add Constraint</Button></div>
                                        </React.Fragment>
                                        : <JsonForm setCollection={(data)=>setSelectedCollection(data)} data={selectedCollection} />
                                        }
                                        <div>
                                            <Button onClick={()=>{setSelectedConfg(selectedField)}}>Cancel</Button>
                                            <Button onClick={()=>{save()}} style={{marginLeft: '20px'}}>Save</Button>
                                            {selectedField!=='new_field' && <Button onClick={()=>{deleteValidator()}} style={{marginLeft: '20px'}}>Remove</Button>}
                                        </div>
                                        
                                    </div>
                                    
                                }
                            </Grid.Column>
                    </Grid>
                </Segment>
            </SegmentGroup>
        </React.Fragment>
    );
    
}

export default ValidationForm;