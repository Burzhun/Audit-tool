import React from 'react';
import PDFViewer from 'pdf-viewer-reactjs';


class PdfViewer extends React.Component {

	constructor(props) {
		super(props);
		this.state = {base64:false};
	}

	componentDidMount() {
		console.log('pdf loaded');
		if(!document.pdf_files){
			document.pdf_files={};
		}
		try{
			const link = this.props.link;
			let headers = {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'x-access-token': localStorage.jwtToken
			};
			if(!(link in document.pdf_files)){
		fetch(link+'&base64=1',{credentials:'include', headers: headers})
								.then(response =>{ return response.text()})
								.then(file => {
									this.props.setLoading(false);
									document.pdf_files[link] = file;this.setState({base64:file})
								})
								.catch(error => {} );
			}else 
				this.setState({base64:document.pdf_files[link]})
		}catch(e){
			console.log(e);
		}
	}

	render(){
		
		return this.state.base64 ? 
		<PDFViewer
			document={{base64: this.state.base64}}
		/> : <div style={{textAlign:'center'}}>Loading...</div>;
	}

}

export default PdfViewer;

