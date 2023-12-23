import React from 'react'
import { Button, Header, Icon, Modal, Select, TextArea, Form, Input } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';
import {saveFunction} from '../../../lib/api';

function TransformationModal(props) {
  const [open, setOpen] = React.useState(false);
  const [field, setField] = React.useState(null);
  const [code, setCode] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');

  const manual_exceptions_list = props.config.updates_manual_overwrite_fields ? props.config.updates_manual_overwrite_fields : [];
  const not_ediatable_fields = props.config.update_logics.map(logics => logics.updated_field).filter(f => !manual_exceptions_list.includes(f)).concat(props.config.UnEditableFields);
  
  function setFunction(name){
    const f = props.functions.find(f=>f.name===name);
    if(f){
      setName(name);
      setField(f.updated_field.split('.').pop());
      setCode(f.update_logic);
      setComment(f.description);      
    }
  }

  function run(field, code, comment){
    setError('');
    const new_comment = `Formula Audit. Formula Name: ${name}, Formula: ${code}, User comment:'${comment}'`;
    const result = props.applyTransformation(field, code, new_comment);
    if(result){
      setError(result)
    }else{
      setOpen(false);
    }
  }

  function save(){
    if(name && code && field){
      saveFunction({
        name:name,
        updated_field:field,
        update_logic:code,
        description:comment,
        collectionName:props.collectionName,
        fieldName:props.fieldName
      }).then(data=>{
        if(data.success){
          alert('Successfully saved');          
        }else{
          setError('Something went wrong');
        }
      })
    }
  }

  return (
    <Modal
      closeIcon  
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      className="transform_modal"
      style={{width:'800px', marginLeft:'calc(50% - 400px)',marginTop:'100px', height:'auto'}}
      size='tiny'
      trigger={<Button className="array_row_add_button" data-qa="add-transformation-btn"
        style={{margin: '15px', float: 'right', width:'168px', position: 'relative', left: 0}}>Add Transformation</Button>
      } 
    >
      <Header icon style={{maxHeight:' 60px'}}>
        Apply transformation to all fields
      </Header>
      <Modal.Content>
        {props.functions.length>0 && <div key="user_function">
          <span style={{maxWidth:'91px',display:'inline-block'}}>Use stored function</span>
          <Select data-qa="select-function" selectOnBlur={false} options={props.functions.map(f=>{return {text:f.name, value:f.name}})} onChange={(e, data)=>{setFunction(data.value);}} />
        </div>}
        <div key="field">
          Updated field: <Select data-qa="updated-field" value={field}  disabled={!props.allow_create} options={props.fields.filter(f=>!not_ediatable_fields.includes(props.fieldName+'.'+f)).map(f=>{return {text:f, value:f}})} onChange={(e, data)=>{setField(data.value)}} />
        </div>
        <div key="function">
          <span style={{verticalAlign:'top',marginRight:'10px'}}>Function f(x):</span> 
          <Form style={{display:'inline-block'}}><TextArea data-qa="set-function" value={code} style={{width:'400px'}} onChange={(e, data)=>{setCode(props.allow_create ? data.value : code)}} /> </Form>
        </div>
        <div key="comment">
        <span style={{marginRight:'21px'}}>Comment:</span> <Input data-qa="function-comment" value={comment} onChange={(e, data)=>{setComment(data.value)}} />
        </div>
        {error && <div data-qa="error-msg" style={{color:'red', fontSize:'15px'}}>{error}</div>}
      </Modal.Content>
      <Modal.Actions>
        {props.allow_create && <span style={{float:'left'}}>
          Save as <Input value={name} onChange={(e, data)=>setName(data.value)} />
          <Button data-qa="save-btn" style={{marginLeft:'10px'}} color='blue' onClick={()=>save()}>Save Function</Button>
        </span>}
        <Button data-qa="cancel-btn" color='red' inverted onClick={() => setOpen(false)}>
          <Icon name='remove' /> Cancel
        </Button>
        <Button data-qa="apply-btn" color='green' inverted onClick={() => {run(field, code, comment);}}>
          <Icon name='checkmark' /> Apply
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

export default TransformationModal;