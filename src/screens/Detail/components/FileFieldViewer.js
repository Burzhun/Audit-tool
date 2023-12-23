import React from 'react';
import { Tab } from 'semantic-ui-react';
import FileViewer from './FileViewer';

export default class FileFieldViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      panes: [],
    };
  }

  static setPanes(props) {
    const { links } = props;
    let max_index = 0;
    let panes = [];
    if (links && Array.isArray(links)) {
      panes = links.map((element, index) => {
        max_index = index + 1;
        return { menuItem: `Image ${index + 1}`, render: () => <Tab.Pane><FileViewer config={props.config} file_index={index} field_key={props.field_key} ImageLink={element} /></Tab.Pane> };
      });
    }
    panes.push({ menuItem: '+', render: () => <Tab.Pane><FileViewer ImageLink="" config={props.config} file_index={max_index} field_key={props.field_key} new_image /></Tab.Pane> });
    return panes;
  }

  componentDidMount() {
    const panes = FileFieldViewer.setPanes(this.props);
    this.setState({ panes });
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const panes = FileFieldViewer.setPanes(nextProps);
    return { panes };
  }

  render() {
    return <Tab defaultActiveIndex="0" panes={this.state.panes} />;
  }
}
