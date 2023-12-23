import React from 'react';
import 'tui-image-editor/dist/tui-image-editor.css';
import { MoonLoader } from 'react-spinners';
import { BACKEND_URL } from '../../../lib/api';
import ImageEditor from '@toast-ui/react-image-editor';


const icona = require('tui-image-editor/dist/svg/icon-a.svg');
const iconb = require('tui-image-editor/dist/svg/icon-b.svg');
const iconc = require('tui-image-editor/dist/svg/icon-c.svg');
const icond = require('tui-image-editor/dist/svg/icon-d.svg');

class ImageViewer extends React.Component {
  constructor(props) {
	    super(props);
	    this.state = {
      zoom: false, scrollX: 0, scrollY: 0, width_initial: false, image_n: 1, base64: false, loading: true,
    };
	    this.editorRef = React.createRef();
    this.zoom = this.zoom.bind(this);
    this.onHover = this.onHover.bind(this);
    this.setInitialWidth = this.setInitialWidth.bind(this);
    this.downloadImage = this.downloadImage.bind(this);
  }

  componentDidMount() {
    this.downloadImage();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!this.props.file_loading && prevProps.file_loading) {
      this.downloadImage(true);
      return;
    }
    if (this.props.data.random !== prevProps.data.random) { this.downloadImage(); }
  }

  downloadImage(update = false) {
    if (!document.image_files) {
      document.image_files = {};
    }
    this.setState({ loading: true });
    const link = `${BACKEND_URL}/database/fetchImage?fileKey=${this.props.ImageLink}`;
    if (!(link in document.image_files) || update) {
      this.props.setLoading(false);
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-access-token': localStorage.jwtToken,
      };
      fetch(`${link}&t=${this.props.data.random}&base64=1`, { credentials: 'include', headers })
        .then((response) => response.text())
    						.then((file) => {
          document.image_files[link] = `data:image/jpeg;base64,${file}`;
          const width_initial = this.setInitialWidth();
          this.setState({
            base64: document.image_files[link], loading: false, zoom: width_initial, width_initial,
          });
        });
    } else {
      if (!this.state.base64 || this.state.base64 !== document.image_files[link]) { this.setState({ base64: document.image_files[link] }); }
      this.props.setLoading(false);
      const width_initial = this.setInitialWidth();
      this.setState({ loading: false, zoom: width_initial, width_initial });
    }
  }

  setInitialWidth() {
    if (!document.getElementById('image_id')) return 100;
    const image_width = document.getElementById('image_id').clientWidth;
    const image_div_width = document.getElementById('image_div_id').clientWidth;
    const width = image_width * 100 / image_div_width;
    this.setState({ width_initial: width });
    return width;
  }

  fileUpload() {
    const editorInstance = this.editorRef.current.getInstance();
	    const image_base64 = editorInstance.toDataURL();
    // this.setState({loading:true})

    const formData = new FormData();
    if (image_base64) formData.append('base64_file', image_base64);
    formData.append('field_key', this.props.field_key);
    formData.append('file_index', this.props.file_index);
    formData.append('RecordId', this.props.data.RecordId);
    formData.append('is_image_edit', 1);
    formData.append('FirmIdNumber', this.props.data.FirmIdNumber);
    formData.append('collectionName', this.props.data.collectionName);
    formData.append('email', this.props.data.user.email);
    formData.append('image_link', this.props.ImageLink);
    this.props.uploadImage(formData);
    this.forceUpdate();
  }

  zoom(zoom_in = true, e = false) {
  		if (e) e.preventDefault();
  		let { zoom } = this.state;
  		let { width_initial } = this.state;
  		if (!width_initial) {
  			width_initial = this.setInitialWidth();
  		}
  		if (zoom_in) {
  			if (zoom) {
  				if (zoom < 800) if (zoom) zoom += 60;
  			} else zoom = width_initial + 60;
  		} else {
  			zoom -= 60;
  		}
    this.setState({ zoom });
    // alert(e.target.width);
    const parent = e.target.parentElement;
    setTimeout((target, parent, state) => {
      parent.scrollTop = target.height * state.scrollY - parent.clientHeight / 2;
      parent.scrollLeft = target.width * (1 - state.scrollX) - parent.clientWidth / 2;
    }, 0, e.target, parent, this.state);
  	}

  	onHover(e) {
  		const x = e.nativeEvent.offsetX / e.target.width;
  		const y = e.nativeEvent.offsetY / e.target.height;
    this.setState({ scrollX: x, scrollY: y });
  	}

  render() {
    if (this.state.loading) {
      return (
        <div className="image_loader">
          <MoonLoader
            sizeUnit="px"
            size={100}
            color="#A4DA2A"
            loading={this.state.loading}
          />
        </div>
      );
    }
    return (
      <>
        <div style={{ padding: '10px', width: '100%' }}>
          {!this.props.image_editor
            ? (
              <div
                id="image_div_id"
style={{
              overflow: 'scroll', maxHeight: '100vh', transform: 'scaleX(-1)', textAlign: 'center',
            }}
              >
                {this.state.base64 ? (
                  <img
                id="image_id"
                onClick={(e) => this.zoom(true, e)}
                style={{ transform: 'scaleX(-1)', width: this.state.zoom ? `${this.state.zoom}%` : 'auto' }}
                onContextMenu={(e) => this.zoom(false, e)}
                onMouseMove={this.onHover}
                alt=""
                src={this.state.base64}
              />
                ) : <div style={{ textAlign: 'center', transform: 'scaleX(-1)' }}>Loading...</div>}
              </div>
            )
		    	: (
  <div>
    <ImageEditor
      ref={this.editorRef}
      usageStatistics={false}
      includeUI={{
			      loadImage: {
			        path: this.state.base64,
			        name: 'SampleImage',
			      },
			      theme: {
          'menu.normalIcon.path': icond,
			      'menu.activeIcon.path': iconb,
			      'menu.disabledIcon.path': icona,
			      'menu.hoverIcon.path': iconc,
			      'submenu.normalIcon.path': icond,
			      'submenu.activeIcon.path': iconb,
			      'common.bi.image': 'https://uicdn.toast.com/toastui/img/tui-image-editor-bi.png',
			      'common.bisize.width': '251px',
			      'common.bisize.height': '21px',
			      'common.backgroundImage': './img/bg.png',
			      'common.backgroundColor': '#fff',
			      'common.border': '1px solid #c1c1c1',
			      'colorpicker.button.border': '0px',
			    'colorpicker.title.color': '#000',
			  	  },
			      menu: ['shape', 'filter', 'draw'],
			      initMenu: 'draw',
			      uiSize: {
			        width: '1000px',
			        height: '700px',
			      },
			      menuBarPosition: 'bottom',
			    }}
      selectionStyle={{
			      cornerSize: 20,
			      rotatingPointOffset: 70,
			    }}
      id="image_editor"
    />
  </div>
            )}
        </div>
      </>
    );
  }
}
export default ImageViewer;
