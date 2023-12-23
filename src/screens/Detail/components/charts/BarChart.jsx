import React from 'react';
import { Label,BarChart,  Bar, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceDot } from 'recharts';
import moment from "moment";


export default class BarChartView extends React.Component {

	constructor(props) {
        super(props);
        this.state = {selectedPoint:null};
    }

    componentDidUpdate(prevProps, prevState, snapshot){
      if(this.state.selectedPoint !== this.props.context.selectedArrayField)
        this.setState({selectedPoint:this.props.context.selectedArrayField})
    }
	

  handleClick(data, index) {
    this.props.context.setSelectedArrayField({id:data['id'],field:data['fieldName']});
  }

  show_tooltip(data,payload, props){
      if(payload && payload.length){
      let xInfo = <div>{props.xAxisName}: {this.convertToDate((payload[0]['value']).toString(), true)}</div>
      if(payload[0]['name']==='index' && props.xAxisScale==='Equal distance'){
        const xValue = this.convertToDate(this.getAxisValue(data,payload[0].value,props.xAxisName), true).toString();
        xInfo = <div>{props.xAxisName}: {xValue}</div>
      }
      return <div>{xInfo}</div>;
    }
    return '';
  }

  convertToDate(value, for_tooltip=false){
    if(!value) return '';
    if(value && value.toString().length===13){
      value = value/1000;
      return moment.unix(value).format(for_tooltip ? 'MMM Do YYYY, h:mm:ss a' : 'YYYY MM DD, h:mm:ss a');
    }
    return value
  }

  getAxisValue(data,index,axis){
    const el = data.find(t=>t.index===index);
    if(el && el[axis])
      return el[axis];
    return null;
  }
  
  render() {
    const data = this.props.data;
    if(!data[0]) return null;
    const xEqual = this.props.xAxisScale==='Equal distance';
    const yEqual = this.props.yAxisScale==='Equal distance';
    let selectedPoint=null;
    if(this.state.selectedPoint && this.state.selectedPoint.field === data[0]['fieldName']){
      const point_field = data.find(t=>t['id']===this.state.selectedPoint['id']);
      if(point_field){
        selectedPoint={x:point_field[xEqual ? 'index' : this.props.xAxisName],
            y:point_field[yEqual ? 'index' : this.props.yAxisName]};
      }
    }
    return (
      <div className="highlight-bar-charts">
          <BarChart
            width={600}
            height={400}
            data={data}
            //onMouseDown = { (e) => this.setState({refAreaLeft:e.activeLabel}) }
            //onMouseMove = { (e) => this.state.refAreaLeft && this.setState({refAreaRight:e.activeLabel}) }
          >
            <CartesianGrid />
             
            <XAxis
              dataKey={xEqual ? 'index' : this.props.xAxisName}
              data={data}
              tickFormatter={(value)=>{ return xEqual ? this.convertToDate(this.getAxisValue(data,value,this.props.xAxisName)) : this.convertToDate(value)}}
              xAxisId='x1'
              scale={xEqual ? 'linear' : this.props.xAxisScale}
            />
           
           
            <YAxis 
              dataKey={yEqual ? 'index' : this.props.yAxisName}
              interval={yEqual ? 1 : 0}
              yAxisId='y1'
              tickFormatter={(value)=>{ return yEqual ? (data.find(t=>t.index===value) ? this.convertToDate(this.getAxisValue(data,value,this.props.yAxisName)) : value) : this.convertToDate(value)}}
              scale={yEqual ? 'linear' : this.props.yAxisScale}
             />
             
             
            <Tooltip  />            
            <Bar yAxisId="y1" key="bar1" barSize={50} xAxisId="x1" onClick={this.handleClick.bind(this)}  type='linear' dataKey={this.props.yAxisName} stroke='#8884d8' animationDuration={300}/>
            {this.props.selectedRecords.map((record,index)=>{
              return <Bar key={"additional_record"+index} fill={record.color} line={{stroke: '#8884d8', strokeWidth: 1}} data={record.data} yAxisId="y1" dataKey={this.props.yAxisName} barSize={300}  name="l1" xAxisId="x1"  animationDuration={300}/>
          })}

          </BarChart> 

      </div>
    );
  }
}


