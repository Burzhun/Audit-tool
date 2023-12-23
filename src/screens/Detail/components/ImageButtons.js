import React from 'react';
import { Button } from 'semantic-ui-react';
import { BACKEND_URL } from '../../../lib/api';
import download from '../../../lib/download';

class ImageButtons extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      load_button_message: this.props.new_image ? 'Load image or file' : 'Replace image',
    };
    this.fileUpload = this.fileUpload.bind(this);
    this.removeFile = this.removeFile.bind(this);
    this.downloadFile = this.downloadFile.bind(this);
    this.fileInput = React.createRef();
  }

  fileUpload(image_base64 = false) {
    this.props.setLoading(true);
    const formData = new FormData();

    if (image_base64) formData.append('base64_file', image_base64);
    else formData.append('file1', this.fileInput.current.files[0]);

    formData.append('field_key', this.props.field_key);
    formData.append('file_index', this.props.file_index);
    formData.append('RecordId', this.props.data.RecordId);
    formData.append('FirmIdNumber', this.props.data.original_data.FirmIdNumber);
    formData.append('collectionName', this.props.data.collectionName);
    formData.append('email', this.props.data.user.email);
    if (this.props.data.config.image_upload_destination) {
      formData.append('s3_bucket_name', this.props.data.config.image_upload_destination.s3_bucket_name || '');
      const data = this.props.data.original_data;
      data.RecordId = this.props.data.RecordId;
      formData.append('s3_folder_name',
        (this.props.data.config.image_upload_destination.s3_folder_name || '').replace(/\$\{([\w\s]+)\}/g, (m, key) => data[key] || '').replace(/\/\//g, '/'));
    }
    this.props.uploadImage(formData);
  }

  removeFile(message) {
    if (message) {
      if (!window.confirm((message))) return;
    }
    const fields = {};
    fields.field_key = this.props.field_key;
    fields.file_index = this.props.file_index;
    fields.RecordId = this.props.data.RecordId;
    fields.FirmIdNumber = this.props.data.original_data.FirmIdNumber;
    fields.collectionName = this.props.data.collectionName;
    fields.email = this.props.data.user.email;
    this.props.removeImage(fields);
  }

  downloadFile(message) {
    if (message) {
      if (!window.confirm((message))) return;
    }
    if (this.props.is_custom_file) {
      const link = this.props.ImageLink;
      const parts = link.split('/');
      let name = parts[parts.length - 1];
      name = name.indexOf('_') > 0 ? name.substr(name.indexOf('_') + 1) : name;
      const type = name.split('.')[1];
      const new_ilnk = `${BACKEND_URL}/database/fetchImage?fileKey=${link}&t=${this.props.data.random}`;
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-access-token': localStorage.jwtToken,
      };
      fetch(`${new_ilnk}&base64=1`, { credentials: 'include', headers })
        .then((response) => response.text())
        .then((file) => {
          download(`data:application/${type};base64,${file}`, name);
        });
    } else {
      const image_element = document.querySelector('#image_id');
      const linkSource = image_element.getAttribute('src');
      const downloadLink = document.createElement('a');
      downloadLink.href = linkSource;
      downloadLink.download = 'Image file';
      downloadLink.click();
    }
    // const link = BACKEND_URL + '/database/fetchImage?fileKey=' + this.props.ImageLink;
    // window.open(link);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const load_button_message = nextProps.new_image ? 'Load image or file' : 'Replace image';
    return { load_button_message };
  }

  render() {
    const { image_edit_options } = this.props;
    const load_button_key = this.state.load_button_message === 'Load image or file' ? 'load_button' : 'replace_button';
	  	return (
  <div className="image_buttons">
    {this.props.is_custom_file
      ? (
        <>
          {image_edit_options.download_button && (
          <Button data-qa={`Download file ${this.props.file_name}`} onClick={() => { this.downloadFile(image_edit_options.download_button.warning); }}>
            Download file
            {this.props.file_name}
          </Button>
          )}
          {image_edit_options.remove_button && <Button data-qa="remove" onClick={() => { this.removeFile(image_edit_options.remove_button.warning); }}>Remove</Button>}
        </>
      ) : (
        <>
          <input ref={this.fileInput} accept=".jpg, .jpeg, .png, .pdf, .doc" style={{ display: 'none' }} type="file" onChange={(e) => { this.fileUpload(); }} />
          {image_edit_options[load_button_key] && <Button data-qa={this.state.load_button_message} onClick={() => { if (!image_edit_options[load_button_key].warning || window.confirm(image_edit_options[load_button_key].warning)) this.fileInput.current.click(); }}>{this.state.load_button_message}</Button>}
          {!this.props.image_editor ? (image_edit_options.edit_button && this.props.show_image && <Button data-qa="edit" onClick={() => { this.props.editImage(image_edit_options.edit_button.warning); }}>Edit</Button>)
            : (
              <>
                <Button data-qa="cancel" onClick={() => { this.props.cancelEditedImage(); }}>Cancel</Button>
                <Button data-qa="save-img" onClick={() => { this.props.saveEditedImage(); }}>Save</Button>
              </>
            )}
          {image_edit_options.remove_button && !this.props.new_image && <Button data-qa="remove" onClick={() => { this.removeFile(image_edit_options.remove_button.warning); }}>Remove</Button>}
          {image_edit_options.download_button && !this.props.new_image && this.props.data.config && this.props.data.config.AllowImageAndPdfDownloads && <Button data-qa="download" onClick={() => { this.downloadFile(image_edit_options.download_button.warning); }}>Download</Button>}
        </>
      )}
  </div>
    );
  }
}

export default ImageButtons;
