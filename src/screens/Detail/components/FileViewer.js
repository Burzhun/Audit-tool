import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { MoonLoader } from 'react-spinners';
import { uploadFile, removeFile } from '../../../actions';
import { BACKEND_URL } from '../../../lib/api';
import PdfViewer from './PdfViewer';
import ImageButtons from './ImageButtons';
import ImageViewer from './ImageViewer';
import FileContext from './FileContext';
// import DoubleScrollbar from 'react-double-scrollbar';

class FileViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { image_editor: false, loading: false };
    this.image_view = React.createRef();
    this.fileUpload = this.fileUpload.bind(this);
    this.cancelEditedImage = this.cancelEditedImage.bind(this);
    this.editImage = this.editImage.bind(this);
    this.removeImage = this.removeImage.bind(this);
    this.saveEditedImage = this.saveEditedImage.bind(this);
    this.setLoading = this.setLoading.bind(this);
  }

	static propTypes = {
	    ImageLink: PropTypes.string,
	};

	setLoading(value) {
	  this.setState({ loading: value });
	}

	fileUpload(formData) {
	  this.setState({ loading: true });
	  this.props.uploadFile(formData);
	}

	editImage(message) {
	  if (message) {
	    if (!window.confirm((message))) return;
	  }
	  this.setState({ image_editor: true });
	}

	cancelEditedImage() {
	  this.setState({ image_editor: false });
	}

	saveEditedImage() {
	  this.setState({ image_editor: false, loading: true });
	  this.image_view.current.fileUpload();
	}

	removeImage(formData) {
	  this.setState({ loading: true });
	  this.props.removeFile(formData);
	}

	render() {
	    let extension = 'png';
	    let displayedS3Data = <div>No image found</div>;
	  let show_image = false;
	  const image_extensions = ['jpg', 'gif', 'png', 'tiff', 'bmp', 'svg', 'jpeg'];
	  let is_custom_file = false;
	  let file_name = '';
	    if (this.props.ImageLink) {
	        extension = this.props.ImageLink.split('.');
	    extension = extension[extension.length - 1].toLowerCase();
	        if (extension === 'pdf') {
	            displayedS3Data = (
					<PdfViewer
						link={`${BACKEND_URL}/database/fetchImage?fileKey=${this.props.ImageLink}`}
    					setLoading={this.setLoading}
					/>
				);
			} else if (image_extensions.includes(extension)) { show_image = true; } else {
			displayedS3Data = (
				<div>
					<br />
					Can't display the file
				</div>
			);
				is_custom_file = true;
				file_name = this.props.ImageLink.split('_');
				if (file_name.length > 0) { file_name = file_name[file_name.length - 1]; } else {
					file_name = this.props.ImageLink.split('/');
					file_name = file_name[file_name.length - 1];
				}
			}
		}
		let show_buttons = false;
		let image_edit_options = false;
		if (this.props.config) {
			image_edit_options = this.props.config.image_edit_options;
			show_buttons = !image_edit_options || Object.keys(image_edit_options).find((p) => image_edit_options[p].visible);
			if (image_edit_options) Object.keys(image_edit_options).forEach((key) => { if (!image_edit_options[key].visible) delete image_edit_options[key]; });
			else {
				image_edit_options = {
					load_button: { visible: true, warning: '' },
					delete_button: { visible: true, warning: '' },
					download_button: { visible: true, warning: '' },
					replace_button: { visible: true, warning: '' },
					remove_button: { visible: true, warning: '' },
					edit_button: { visible: true, warning: '' },
				};
			}
		}
	    return (
  <FileContext.Consumer>
    {(value) => (
      <div>
        {show_buttons && (
        <ImageButtons
          file_index={this.props.file_index}
          field_key={this.props.field_key}
          data={value}
          image_editor={this.state.image_editor}
          new_image={this.props.new_image}
          show_image={show_image}
          file_name={file_name}
          image_edit_options={image_edit_options}
          is_custom_file={is_custom_file}
          cancelEditedImage={this.cancelEditedImage}
          removeImage={(formData) => this.removeImage(formData)}
          ImageLink={this.props.ImageLink}
          setLoading={this.setLoading}
          editImage={this.editImage}
          saveEditedImage={this.saveEditedImage}
          uploadImage={(formData) => this.fileUpload(formData)}
        />
        )}
        <div style={{ display: !this.state.loading ? 'block' : 'none' }}>
          {
						!this.props.new_image && (show_image
						  ? (
  <ImageViewer
    file_index={this.props.file_index}
    field_key={this.props.field_key}
    data={value}
    new_image={this.props.new_image}
    setLoading={this.setLoading}
    file_loading={this.state.loading}
    key={this.props.field_key + this.props.file_index}
    image_editor={this.state.image_editor}
    ImageLink={this.props.ImageLink}
    ref={this.image_view}
    uploadImage={(formData) => this.fileUpload(formData)}
  />
						  ) : displayedS3Data)

					}
        </div>
        <div className="image_loader">
          <MoonLoader
            sizeUnit="px"
            size={100}
            color="#A4DA2A"
            loading={this.state.loading && !is_custom_file && this.props.ImageLink}
          />
        </div>

      </div>
	    	)}
  </FileContext.Consumer>
	  );
	}
}
const mapStateToProps = (state) => ({
  // new_image: state.authReducer.new_image,

});

const mapDispatchToProps = (dispatch) => ({
  uploadFile: (data) => dispatch(uploadFile(data)),
  removeFile: (data) => dispatch(removeFile(data)),
});

export default connect(mapStateToProps, mapDispatchToProps)(FileViewer);
