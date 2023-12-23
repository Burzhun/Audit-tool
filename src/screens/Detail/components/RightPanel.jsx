import React from 'react';
import { Tab, Menu, Icon } from 'semantic-ui-react'
import FileFieldViewer from './FileFieldViewer';
import ChartViewer from './ChartViewer';
import { element } from 'prop-types';

export default class RightPanel extends React.Component {
  constructor(props) {
		super(props);
		this.state = {
      tab_type:0,
      show_tab:true
		}
  }
  
  componentDidMount(){
    setTimeout(()=>{
      //sometimes first tab doesn't load automatically for some reason
      const elements = document.querySelectorAll('.detail_right_tab .four.wide.column .menu a.item');
      if(elements.length>1 && elements[1].className==='item') elements[1].click();
    },2000)
  }

  render(){
    let fields = this.props.ImageLinks && Array ? this.props.ImageLinks : {};
    const data = this.props.data;
    if(data && data['RecordId']===-1) return null;
    let image_keys = Object.keys(fields);
    this.props.config.ImageFieldNames.forEach(key=>{
      if(!image_keys.includes(key)) fields[key] = [];
    });
    let panes = [];
    if(this.state.tab_type!==2){
      panes = Object.keys(fields).map((key)=>{
        return { menuItem: key, render: () => <Tab.Pane key={key}><FileFieldViewer field_key={key} config={this.props.config} links={fields[key]} /></Tab.Pane> };
      });
    }
    
    if(this.state.tab_type!==1 && this.props.config && this.props.config.Charts){
      const charts = this.props.config.Charts.charting_options;
      charts.forEach((chart_config)=>{
        const chartField = chart_config.ArrayFieldName.split('.')[1];
        if(data && data['CurrentState'][chartField]){
          panes.push({ menuItem:chartField,render:()=><Tab.Pane key={chartField}><ChartViewer config={this.props.config} field_key={chartField} data={data} chart={chart_config} /></Tab.Pane>})
        }
      });
    }

    const t = this.state.tab_type;
    panes = [{menuItem: (
      <Menu.Item active={false} disabled link key='empty'>
        <span  key="special_tab_selector" className="item"> <Icon onClick={()=>{this.setState({show_tab: false})}} className="hide_right_tab" name="close" /> <span data-qa={'qa-images'} className={"tab_type_selector " + (t===1 && 'selected')} onClick={()=>this.setState({tab_type:1})}>Images</span> | <span data-qa='qa-charts' className={"tab_type_selector " + (t===2 && 'selected')} onClick={()=>this.setState({tab_type:2})}>Charts</span></span>
      </Menu.Item>
    ),  render:()=><Tab.Pane key="empty"></Tab.Pane>}].concat(panes);

    return <div className={"detail_right_tab "+(this.state.show_tab ? "" : " no_panes_tab")}>
            {!this.state.show_tab && <Icon onClick={()=>{this.setState({show_tab: true})}} className="show_right_tab" name="align justify" />}
            <Tab
            defaultActiveIndex={panes.length>1 ? 1 : 0}
            menu={{  vertical: true }}
            menuPosition='right'
            panes={panes}
            grid={this.state.show_tab ? { paneWidth: 12, tabWidth: 4 } : { paneWidth: 16, tabWidth: 1 }}
            />
          </div>;
  }
}
