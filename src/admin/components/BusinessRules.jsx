import React, {useState, useEffect} from 'react';
import {
    Grid,
    Segment,
    SegmentGroup,
    Input,TextArea,
    Button,Checkbox,
  } from 'semantic-ui-react';
import SortableMultiSelect from './SortableMultiSelect';

let rules = {};
let fields = [];
let outerFields = [];
const BusinessRules = (props)=>{
    const [rule, setRule] = useState(null);
    const [ruleData, setRuleData] = useState([]);
    const ruleTypes=['Range', 'NoOverlapping', 'UniqueFieldCombinations', 'BlockingValues'];
    const ruleTypeNames={'Range':'Range Gaps', 'NoOverlapping':'No Range Overlaps', 'UniqueFieldCombinations':'UniqueFieldCombinations','BlockingValues':'Blocking Values'};
    

    useEffect(()=>{
        setRuleData([]);
        rules = {};
        ruleTypes.forEach(r=>{
            if(props.config.BusinessRules){
                const businessRule = props.config.BusinessRules.find(br=>br.RuleType===r);
                if(businessRule){
                    rules[r] = businessRule.Rules;
                    return;
                }
            }
            rules[r] = [];
        });
        if(rule && rules[rule])
            setRuleData(rules[rule]);
        if(props.scheme){
            fields = [];
            outerFields = [];
            props.scheme.fields.forEach((f,i)=>{
                const ar = f.name.split('.');
                if(ar[ar.length-2]==='[]' && ar[ar.length-1]!=='_id' && ar[0]==='CurrentState'){
                    if(!props.scheme.fields[i+1] || props.scheme.fields[i+1].name!==f.name+'.[]' || props.scheme.fields[i+1].types[0].type!=='object')
                        fields.push(f.name.replace(/\.\[\]/g,''));
                }
                if(ar.length===2 && ar[0]==='CurrentState' && !props.config.ComplexFields.includes(ar[1])) outerFields.push(f.name.replace(/\.\[\]/g,'')); 
            });
        }
    },[props.collection, props.config]);

    useEffect(()=>{
        if(rules[rule])
            setRuleData(rules[rule]);
    },[rule])

    function setField(index, field, value){
        const data = ruleData.slice(0);
        let new_rule = Object.assign({}, data[index]);
        new_rule[field] = value;
        data[index] = new_rule;
        setRuleData(data);
    }

    function addField(){
        const data = ruleData.slice(0);
        if(rule==='Range'){
            data.push({rangeFields:[], groupFields:[], gap:'', errorMessage:'', enabled: true, name:''});
        }
        if(rule==='NoGaps' || rule==='NoOverlapping'){
            data.push({rangeFields:[], groupFields:[], errorMessage:'', enabled: true, name:''});
        }
        if(rule==='UniqueFieldCombinations'){
            data.push({outerFields:[], complexFields:[], errorMessage:'', enabled: true, name:''});
        }
        if(rule==='BlockingValues'){
            data.push({field:null, name:'', blockingValue:null, errorMessage:'', groupFields:[], enabled: true});
        }
        setRuleData(data);
    }

    function remove(index){
        const data = ruleData.slice(0);
        data.splice(index, 1);
        setRuleData(data);
    }

    function save(){
        const i = props.config.BusinessRules ? props.config.BusinessRules.findIndex(br=>br.RuleType===rule) : -1;
        let new_rules = props.config.BusinessRules ? props.config.BusinessRules.slice(0) : [];
        if(ruleData.find((r,i)=>{
            if(r.gap===''){alert('Gap field is not set'); return true;}
            if(r.rangeFields!==undefined ){ 
                if(r.rangeFields.length===0){ alert('Range fields are not set'); return true;}
                if(ruleData.findIndex(r2=>{if(r2.rangeFields.toString()===r.rangeFields.toString()) return true;})!==i){ 
                    alert('Range fields must be unique'); return true;
                }
            }
            if(r.complexFields!==undefined){
                if(r.complexFields.length===0) { alert('Complex fields are not set'); return true;}
                if(ruleData.findIndex(r2=>{if(r2.complexFields.toString()===r.complexFields.toString()) return true;})!==i){ 
                    alert('Complex fields must be unique'); return true;
                }
            }
            if(r.name===''){ alert('Name field are not set'); return true;}            
            if(r.groupFields!==undefined && false ){ 
                if(r.groupFields.length===0){ alert('Group fields are not set'); return true;}
            }
            if(ruleData.findIndex(r2=>{if(r2.name===r.name) return true;})!==i){ alert('Name must be unique'); return true;}
            if(r.errorMessage===''){ alert('Error message field must not be empty'); return true;}
        })) return;
        if(i>=0){
            let data = Object.assign({}, new_rules[i]);
            data['Rules'] = ruleData;
            new_rules[i] = data;
        }else
            new_rules.push({RuleType:rule, Rules: ruleData});
        props.updateConfg({data:new_rules, field:'BusinessRules',activeCollection:props.collection});
    }

    
    //setFieldsList();
    return(
        <React.Fragment>
            
            <SegmentGroup>
                <Segment textAlign="center" style={{width:'100%'}}>Set Business Rules</Segment>
                <Segment>
                    <Grid relaxed='very' columns='equal'>
                            <Grid.Column >
                                <div className="validators-container fields-list" data-qa="validators-fields">
                                    {ruleTypes.map((name,index)=>{
                                        return (
                                            <div data-qa={name} key={name+'key'+index} t={name} className={rule===name ? 'selected' : ''} onClick={()=>setRule(name)}>
                                                {ruleTypeNames[name]}
                                            </div>
                                        )
                                    })}                                        
                                </div>
                                {/*<div className="validators-container">
                                    <Button data-qa="add-validator-btn" onClick={()=>setSelectedConfg('new_field', true)}>Add Field</Button>
                                </div>*/}
                            </Grid.Column>
                            <Grid.Column width={12}>

                                {rule &&
                                    <div className="validators-container values-list" data-qa="validators-values">
                                        <div>
                                            
                                            <span className="names-column">Field Name</span>
                                            <span className="values-column" data-qa="field-name">{rule}</span>

                                            <div>
                                                <React.Fragment>
                                                    {['Range', 'NoOverlapping'].includes(rule) && ruleData.map((r, index)=>(
                                                        <div key={rule+index} style={{border:'1px solid #00000057', padding:'10px'}}>
                                                            <span style={{width:'93px', display:'inline-block'}}>Name</span><Input key={rule+'name'+index} style={{width:'400px'}} value={r.name || ''} onChange={(e,data)=>{setField(index, 'name', data.value)}} />
                                                            <Checkbox label="Enabled" style={{padding:'0px 15px'}} onChange={(e, data)=>setField(index, 'enabled', data.checked)} checked={r.enabled!==false} />
                                                            <Button style={{marginLeft:'10px'}} onClick={()=>remove(index)}>Delete</Button>
                                                            <div>
                                                                <span>Error Message </span>
                                                                <TextArea placeholder="Error message" style={{width:'600px'}} value={r.errorMessage} onChange={(e,data)=>{setField(index, 'errorMessage', data.value)}} />
                                                                <span className="business_rule_labels">
                                                                    <span>{'{lowest_field}'}</span>
                                                                    <span>{'{row_numer}'}</span>
                                                                    <span>{'{table_number}'}</span>
                                                                    <span>{'{table_name}'}</span>
                                                                    {rule==='Range' && <span>{'{gap}'}</span>}
                                                                    <span>{'{group_fields}'}</span>
                                                                </span>
                                                            </div>
                                                            
                                                            <div>Range Fields</div>
                                                            <SortableMultiSelect
                                                                isMulti={true}
                                                                className=""
                                                                styles={{width:'300px'}}
                                                                value={(r.rangeFields || []).map((f)=>({value: f, label: f}))}
                                                                onChange={(values,m)=>setField(index,'rangeFields',values ? values.map(v=>v.label) : [])}
                                                                options={fields.map((f)=>({value: f, label: f}))}
                                                            />
                                                            {rule==='Range' && <div>
                                                                <span>Range Gap  </span>
                                                                <Input placeholder="Gap" value={r.gap} onChange={(e,data)=>{setField(index, 'gap', data.value)}} />
                                                            </div>}
                                                            
                                                            <div>Grouping Fields</div>
                                                            <SortableMultiSelect
                                                                isMulti={true}
                                                                className=""
                                                                styles={{width:'300px'}}
                                                                value={(r.groupFields || []).map((f)=>({value: f, label: f}))}
                                                                onChange={(values,m)=>setField(index,'groupFields',values ? values.map(v=>v.label) : [])}
                                                                options={fields.map((f)=>({value: f, label: f}))}
                                                            />

                                                            <div>Disable Condition Field</div>
                                                            <SortableMultiSelect
                                                                isMulti={false}
                                                                className=""
                                                                styles={{width:'300px'}}
                                                                value={{value: r.disableField, label: r.disableField}}
                                                                onChange={(value,m)=>setField(index,'disableField',value ? value.label : '')}
                                                                options={fields.map((f)=>({value: f, label: f}))}
                                                            />
                                                        </div>
                                                    ))}
                                                    {rule==='UniqueFieldCombinations' && ruleData.map((r, index)=>(
                                                        <div key={rule+index} style={{border:'1px solid #00000057', padding:'10px'}}>
                                                            <span style={{width:'93px', display:'inline-block'}}>Name</span><Input key={rule+'name'+index} style={{width:'400px'}} value={r.name || ''} onChange={(e,data)=>{setField(index, 'name', data.value)}} />
                                                            <Checkbox label="Enabled" style={{padding:'0px 15px'}} onChange={(e, data)=>setField(index, 'enabled', data.checked)} checked={r.enabled!==false} />
                                                            <Button style={{marginLeft:'10px'}} onClick={()=>remove(index)}>Delete</Button>
                                                            <div>
                                                                <span>Error Message </span>
                                                                <TextArea placeholder="Error message" style={{width:'600px'}} value={r.errorMessage} onChange={(e,data)=>{setField(index, 'errorMessage', data.value)}} />
                                                                <span className="business_rule_labels">
                                                                    <span>{'{complex_fields}'}</span>
                                                                </span>
                                                            </div>
                                                           
                                                            <div>Outer Fields</div>
                                                            <SortableMultiSelect
                                                                isMulti={true}
                                                                className=""
                                                                placeholder="Outer Fields"
                                                                styles={{width:'300px'}}
                                                                value={(r.outerFields || []).map((f)=>({value: f, label: f}))}
                                                                onChange={(values,m)=>setField(index,'outerFields',values ? values.map(v=>v.label) : [])}
                                                                options={outerFields.map((f)=>({value: f, label: f}))}
                                                            />

                                                            <div>Complex Fields</div>
                                                            <SortableMultiSelect
                                                                isMulti={true}
                                                                className=""
                                                                styles={{width:'300px'}}
                                                                value={(r.complexFields || []).map((f)=>({value: f, label: f}))}
                                                                onChange={(values,m)=>setField(index,'complexFields',values ? values.map(v=>v.label) : [])}
                                                                options={fields.filter(f=>f.split('.').length===3).map((f)=>({value: f, label: f}))}
                                                            />
                                                        </div>
                                                    ))}
                                                    {rule==='BlockingValues' && ruleData.map((r, index)=>(
                                                        <div key={rule+index} style={{border:'1px solid #00000057', padding:'10px'}}>
                                                            <span style={{width:'93px', display:'inline-block'}}>Name</span><Input key={rule+'name'+index} style={{width:'400px'}} value={r.name || ''} onChange={(e,data)=>{setField(index, 'name', data.value)}} />
                                                            <Checkbox label="Enabled" style={{padding:'0px 15px'}} onChange={(e, data)=>setField(index, 'enabled', data.checked)} checked={r.enabled!==false} />
                                                            <Button style={{marginLeft:'10px'}} onClick={()=>remove(index)}>Delete</Button>
                                                            <span style={{width:'93px', display:'block'}}>Field</span>
                                                            <SortableMultiSelect
                                                                isMulti={false}
                                                                className=""
                                                                placeholder="Select Field"
                                                                styles={{width:'300px'}}
                                                                value={{value: r.field, label: r.field}}
                                                                onChange={(value,m)=>setField(index,'field',value ? value.label : null)}
                                                                options={fields.map((f)=>({value: f, label: f}))}
                                                            />
                                                            <div>
                                                            <span style={{width:'93px', display:'inline-block'}}>Blocking value</span><Input key={rule+'name'+index} style={{width:'400px'}} value={r.blockingValue || ''} onChange={(e,data)=>{setField(index, 'blockingValue', data.value)}} />
                                                            </div>
                                                            <div>
                                                                <span>Error Message </span>
                                                                <TextArea placeholder="Error message" style={{width:'600px'}} value={r.errorMessage} onChange={(e,data)=>{setField(index, 'errorMessage', data.value)}} />
                                                                <span className="business_rule_labels">
                                                                    <span>{'{complex_fields}'}</span>
                                                                </span>
                                                            </div>
                                                           
                                                            <div>Group Fields</div>
                                                            <SortableMultiSelect
                                                                isMulti={true}
                                                                className=""
                                                                placeholder="Outer Fields"
                                                                styles={{width:'300px'}}
                                                                value={(r.groupFields || []).map((f)=>({value: f, label: f}))}
                                                                onChange={(values,m)=>setField(index,'groupFields',values ? values.map(v=>v.label) : [])}
                                                                options={fields.map((f)=>({value: f, label: f}))}
                                                            />
                                                        </div>
                                                    ))}
                                                </React.Fragment>
                                                <Button onClick={()=>addField()}>Add Field</Button>
                                            </div>
                                            <Button onClick={()=>save()}>Save</Button>
                                            
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

export default BusinessRules;
