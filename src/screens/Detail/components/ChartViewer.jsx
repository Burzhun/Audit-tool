import React from 'react';
import { Tab, Select } from 'semantic-ui-react';
import LineChartView from './charts/LineChart';
import BarChartView from './charts/BarChart';
import ScatterChartView from './charts/ScatterChart';
import _ from 'lodash';
import FileContext from './FileContext';
import ChartCompareForm from './ChartCompareForm';
import moment from "moment";

export default class ChartViewer extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
            chartType:'scatter',
            xAxis:null,
            yAxis:null,
            xScale:'linear',
            yScale:'linear',
            selectedRecords:[],
            palette: (props.config.Charts && props.config.Charts['Palette']) ? props.config.Charts['Palette'] : ["#FFFF00","#808000","#008080"]
		}
        this.chart_options=['scatter', 'line', 'bar'].map((t)=>{ return  {text:t, value:t} });
        this.scale_options=['Equal distance', 'linear', 'log'].map((t)=>{ return  {text:t, value:t} });
        this.getChartData = this.getChartData.bind(this);
        this.renderChart = this.renderChart.bind(this);
	}

	

	componentDidMount(){
        const chart_data = this.props.chart;
        const new_state={};
        if(chart_data.ChartType)
            new_state['chartType'] = chart_data.ChartType
        if(chart_data.DefaultXaxis)
            new_state['xAxis'] = chart_data.DefaultXaxis
        if(chart_data.DefaultYaxis)
            new_state['yAxis'] = chart_data.DefaultYaxis
        if(chart_data.XAxisScale)
            new_state['xScale'] = chart_data.XAxisScale=='equalDistance' ? 'Equal distance' : chart_data.XAxisScale
        if(chart_data.YAxisScale)
            new_state['yScale'] = chart_data.YAxisScale=='equalDistance' ? 'Equal distance' : chart_data.YAxisScale
        this.setState(new_state);
    }

    cutFloat(n,only_int=false){
        if(Number(n) === n && n % 1 !== 0)
            return (n).toFixed(4);
        if(only_int && n && Number(n) !== n) {
            if(n.length==26 || moment(n).isValid()) return new Date(n).getTime();// n = n.replace(/[^0-9]/g,'')
            return parseInt(n);
        }
        return n;
    }
    
    getChartData(record_data,z=200,separate=false){
        const xAxis = this.state.xAxis;
        const yAxis = this.state.yAxis;
        if(record_data && xAxis && yAxis && record_data.CurrentState[this.props.field_key] && record_data.CurrentState[this.props.field_key].length>0){
            let data = record_data.CurrentState[this.props.field_key];
            if(data[0][xAxis]!==undefined && data[0][yAxis]!==undefined){
            data = _.sortBy(data,function(item) {
                    let value = item[xAxis];
                    if(typeof value == 'string') value = value.toLowerCase()
                    return value;
                });
        return data.map((field, index)=>{
                    let point={index:index,id:field['_id'],fieldName:this.props.field_key};
                    point[this.state.xAxis] = this.cutFloat(field[xAxis],true);
                    point[this.state.yAxis] = this.cutFloat(field[yAxis],true);
                    point['z']=z; 
                    point['separate'] = separate;
                    return point;
                })
            }else{
                return null;
            }
        }
        return null;
    }
    
    renderChart(){
        let ChartView=null;
        switch(this.state.chartType) {
            case 'line':  
                ChartView = LineChartView;
              break  
            case 'bar':  
                ChartView = BarChartView;
              break 
            case 'scatter':  
                ChartView = ScatterChartView;
              break                   
        }
        const selectedRecords = this.state.selectedRecords.map((record,index)=>{return {color:this.state.palette[index % this.state.palette.length],data:this.getChartData(record,50,true)}})
        return <FileContext.Consumer>
            {context => ( <ChartView context={context} xAxisName={this.state.xAxis} 
                yAxisName={this.state.yAxis} xAxisScale={this.state.xScale} 
                yAxisScale={this.state.yScale} data={this.getChartData(this.props.data)} 
                selectedRecords={selectedRecords}
                />)}
            </FileContext.Consumer>
    }
	

	

	render(){
        let fieldNames = this.props.config.DefaultFieldsToDisplayInAuditSession.find(t=>t['name'] && t['name']===this.props.field_key);
        if(fieldNames) fieldNames = fieldNames.DefaultFieldsToDisplayInAuditSession;
        if(!fieldNames && this.props.data.CurrentState[this.props.field_key].length>0) fieldNames = Object.keys(this.props.data.CurrentState[this.props.field_key][0]);
        const fields_list = this.props.data ? fieldNames.filter(f=>f!=='_id').map(f=>{return {text:f, value:f}}) : null;
        let fields_list_y = fields_list.filter(field=>{
            if(this.props.data.CurrentState[this.props.field_key].length===0) return false;
            const value = this.props.data.CurrentState[this.props.field_key][0][field['text']];
            if(typeof value==='string' || typeof value==='boolean') return false;
            return true;
        })
		return (
            <React.Fragment >
            <Select className="chart_type_selector" style={{float:'right'}} options={this.chart_options} onChange={(e,data)=>this.setState({chartType:data.value})} value={this.state.chartType} />
            <div style={{float:'left'}}>
                <span>Select Y Axis</span><br />
                <Select placeholder="Select Y Axis" options={fields_list_y} onChange={(e,data)=>this.setState({yAxis:data.value})} value={this.state.yAxis} /><br />
                <span> Y Axis Scale</span><br />
                <Select placeholder="Select Y Axis" options={this.scale_options} onChange={(e,data)=>this.setState({yScale:data.value})} value={this.state.yScale} /><br />

            </div>
            <span style={{float:'right'}}>{ this.renderChart() }</span>
            <div style={{float:'right'}}>
            <span style={{display:'inline-block',marginRight:'20px'}}>X Axis Scale<br />         
            <Select placeholder="X Axis Scale" options={this.scale_options} onChange={(e,data)=>this.setState({xScale:data.value})} value={this.state.xScale} />
            </span>  
            <span style={{display:'inline-block'}}>Select X Axis  <br />         
            <Select placeholder="Select X Axis" options={fields_list} onChange={(e,data)=>this.setState({xAxis:data.value})} value={this.state.xAxis} />
            </span>  
            </div>            
            <ChartCompareForm chart={this.props.chart} colors={this.state.palette} field_key={this.props.field_key} recordId={this.props.data['RecordId']} 
            setSelectedRecords={(records)=>{this.setState({selectedRecords:records})}}  record_data={this.props.data} config={this.props.config} />
            </React.Fragment>
        );
	}
}
