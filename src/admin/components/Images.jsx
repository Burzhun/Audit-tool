import React, {useState, useEffect} from 'react';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,Input,
    SegmentGroup,
    Button,Checkbox
  } from 'semantic-ui-react';

const edit_options = {
    "load_button" : {
        "visible" : true,
        "warning" : "warning message load"
    },
    "delete_button" : {
        "visible" : true,
        "warning" : "warning message"
    },
    "download_button" : {
        "visible" : false,
        "warning" : "warning message"
    },
    "replace_button" : {
        "visible" : true,
        "warning" : "warning message"
    },
    "remove_button" : {
        "visible" : true,
        "warning" : "warning message"
    },
    "edit_button" : {
        "visible" : true,
        "warning" : "warning message"
    }
};
const Images = (props)=>{
  const [bucketName, setBucketName] = useState('');
  const [folder, setFolder] = useState('');
  const [allowDownload, setAllowDownload] = useState(false);
  const [imageEdit, setImageEdit] = useState([]);
  const [allowUpload, setAllowUpload] = useState({on:false, warning_to_user : ''});
  const [displayImage, setDisplayImage] = useState(true);
  const [imageFieldNames, setImageFieldNames] = useState([]);

  function setFields(){
    if(props.config.ImageFieldNames) setImageFieldNames(props.config.ImageFieldNames); 
    if(props.config.AllowImageAndPdfDownloads) setAllowDownload(props.config.AllowImageAndPdfDownloads);     
    if(props.config.allow_image_file_upload) setAllowUpload(props.config.allow_image_file_upload); 
    if(props.config.DisplayImages) setDisplayImage(props.config.DisplayImages); 
    if(props.config.image_upload_destination){
        setBucketName(props.config.image_upload_destination.s3_bucket_name); 
        setFolder(props.config.image_upload_destination.s3_folder_name); 
    }

    let options = edit_options;    
    if(props.config.image_edit_options) {
        Object.keys(options).forEach(key=>{
            if(props.config.image_edit_options[key]) options[key] = props.config.image_edit_options[key];
        })
    }
    setImageEdit(Object.keys(options).map(key=>({...options[key],name:key,})))
  }

  useEffect(()=>{
    setFields();
  },[props.config]);


  function setEditOption(index, value, name){
    let data =imageEdit.slice(0);
    data[index][name] = value;
    setImageEdit(data);
  }

  function save(){
    let error = false;
    let data = {
        ImageFieldNames: imageFieldNames,
        AllowImageAndPdfDownloads: allowDownload,
        allow_image_file_upload: allowUpload,
        DisplayImages: displayImage,
        image_upload_destination:{
            s3_bucket_name:bucketName,
            s3_folder_name:folder
        }
        
    };
    let edit_options = {};
    imageEdit.forEach(op=>{
        edit_options[op.name] = {visible: op.visible, warning: op.warning};
    });
    data['image_edit_options'] = edit_options;
    if(error){ 
        alert(error);
        return;
    }
    props.updateConfg({data:data, field:'image settings', activeCollection:props.collection});
  }

  function setFieldName(name, index){
    let data =imageFieldNames.slice(0);
    data[index] = name;
    setImageFieldNames(data);
  }

  function removeField(index){
    let data =imageFieldNames.slice(0);
    data.splice(index, 1);
    setImageFieldNames(data);
  }

  return (
    <SegmentGroup>
        <Segment textAlign="center" style={{width:'100%'}}>Set Image settings</Segment>
        <Segment>
            <Grid relaxed='very' columns='equal' style={{marginLeft:'20px'}} className="image_settings">
                <React.Fragment> 
                    <GridRow style={{borderBottom:'1px solid black'}}>
                        <div>                                           
                        <span className="names-column">S3 Bucket Name </span>
                        <Input value={bucketName} style={{width:'400px'}} onChange={(e, data)=>{setBucketName(data.value)}} /> 
                        </div>
                    </GridRow>
                    <GridRow style={{borderBottom:'1px solid black'}}>
                        <div>                                           
                        <span className="names-column">S3 Folder Name </span>
                        <Input value={folder} style={{width:'400px'}} onChange={(e, data)=>{setFolder(data.value)}} /> 
                        </div>
                    </GridRow>
                    <GridRow style={{borderBottom:'1px solid black'}}>
                        <div>                                           
                        <span className="names-column">Display Images </span>
                        <Checkbox checked={displayImage} onChange={(e, data)=>{setDisplayImage(data.checked)}} /> 
                        </div>
                    </GridRow>
                    <GridRow>
                        <div>                                           
                        <span className="names-column">Allow Images and PDF Download </span>
                        <Checkbox checked={allowDownload} onChange={(e, data)=>{setAllowDownload(data.checked)}} /> 
                        </div>
                    </GridRow>
                    <GridRow style={{flexDirection:'column', borderTop:'1px solid black', borderBottom:'1px solid black'}}>
                        <div>Allow image upload </div><br />
                        <div>                                           
                            <span className="names-column">On</span>
                            <Checkbox checked={allowUpload.on} onChange={(e, data)=>{setAllowUpload({on: data.checked, warning_to_user: allowUpload.warning_to_user}) }} /> 
                        </div>
                        {allowUpload.on && <div>                                           
                            <span className="names-column">Warning to user</span>
                            <Input style={{marginLeft:'10px', width:'800px'}} value={allowUpload.warning_to_user} onChange={(e, data)=>{setAllowUpload({on:true, warning_to_user: data.value})}} /> 
                        </div> }
                    </GridRow>
                    <GridRow style={{flexDirection:'column', borderBottom:'1px solid black'}}>
                        <div>                                           
                        <span className="names-column">Image Field Names</span><br />
                        {imageFieldNames.map((field, i)=>(
                            <div style={{marginBottom:'10px'}}><Input value={field} onChange={(e, data)=>setFieldName(data.value, i)} /> <Button data-qa="filter-remove" className='red' style={{padding:'7px 8px'}} onClick={()=>removeField(i)}>X</Button><br /></div>
                        ))}
                        <Button onClick={()=>{setImageFieldNames([...imageFieldNames,''])}}>Add Field</Button>
                        </div>
                    </GridRow>
                    <GridRow style={{flexDirection:'column'}}>
                        <div>                                            
                        <span className="names-column">Image Edit Options </span>
                        {imageEdit.map((op, index)=>(
                            <div>                                           
                                <b>{op.name}</b> <br />
                                <span className="names-column">On</span>
                                <Checkbox checked={op.visible} onChange={(e, data)=>{setEditOption(index, data.checked, 'visible') }} /> 
                                <span className="names-column">Warning</span>
                                <Input style={{marginLeft:'15px'}} value={op.warning} onChange={(e, data)=>{setEditOption(index, data.value, 'warning')}} /> 
                            </div>
                        ))}
                        </div>
                    </GridRow>
                </React.Fragment>
                
                <GridRow style={{marginLeft:'30px'}}>
                    <Button data-qa="cancel-validator" onClick={()=>{setFields()}}>Cancel</Button>
                    <Button data-qa="save-validator" onClick={()=>{save()}} style={{marginLeft: '20px'}}>Save</Button>
                </GridRow>
            </Grid>
        </Segment>
    </SegmentGroup>
    )
}


export default Images;