import React, {useEffect} from 'react'
import { Button, Header, Icon, Modal, Select, TextArea, Form, Input } from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css';

function TextRepresentationModal(props) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState('');

  const manual_exceptions_list = props.config.updates_manual_overwrite_fields ? props.config.updates_manual_overwrite_fields : [];
  const not_ediatable_fields = props.config.update_logics.map(logics => logics.updated_field).filter(f => !manual_exceptions_list.includes(f)).concat(props.config.UnEditableFields);
  
  useEffect(()=>{
    try{
      if(open && props.config.CopyToText && props.config.CopyToText.mainFunction){
        const table_fields = props.config.DefaultFieldsToDisplayInAuditSession.filter(f=>f.name).map(f=>f.name);
        const f = new Function(['data','keys'],props.config.CopyToText.mainFunction);
        const keys = (props.config.CopyToText.fields || Object.keys(props.data)).filter(f=>!table_fields.includes(f));
        var text_data = f(props.data, keys);
        if(props.config.CopyToText.TableCopy){
          Object.keys(props.config.CopyToText.TableCopy).forEach(table_key=>{
            if(props.data[table_key] && props.data[table_key].length){
              const f = new Function(['record','data','keys'],props.config.CopyToText.TableCopy[table_key].value);
              const keys = props.config.CopyToText.TableCopy[table_key].fields || Object.keys(props.data[table_key][0]);
              let table_data = window.sorted_data[table_key] || props.data[table_key];
              text_data += f(props.data,table_data, keys);
            }
          })
        }
        setText(text_data);
      }
    }catch(e){
      setTimeout(()=>{
        alert(e.toString());
      },500)
      
    }
  },[props.config, open]);


  

  return (
    <Modal
      closeIcon  
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      className="transform_modal"
      style={{width:'1200px', marginLeft:'calc(50% - 600px)',marginTop:'100px', height:'auto'}}
      size='tiny'
      trigger={<Button className="array_row_add_button" data-qa="add-transformation-btn"
        style={{margin: '15px', width:'214px', position: 'relative', left: 0}}>Create text summary</Button>
      } 
    >
      <Header icon style={{maxHeight:' 60px'}}>
        Text Representation of Record
      </Header>
      <Modal.Content>
          <TextArea style={{width:'1100px', height:'400px', resize:'both'}} onChange={(e,data)=>setText(data.value)} value={text} />
      </Modal.Content>
      <Modal.Actions>
        <Button data-qa="cancel-btn" color='red' inverted onClick={() => setOpen(false)}>
          <Icon name='remove' /> Close
        </Button>
      </Modal.Actions>
    </Modal>
  )
}

export default TextRepresentationModal;