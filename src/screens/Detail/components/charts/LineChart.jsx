import React from 'react';
import { Label,ScatterChart,ComposedChart,  Scatter, CartesianGrid, XAxis, YAxis, Tooltip, ReferenceDot } from 'recharts';
import moment from "moment";


export default class LineChartView extends React.Component {

	constructor(props) {
        super(props);
        this.state = {selectedPoint:null, selectedPointOver:false};
    }

    componentDidUpdate(prevProps, prevState, snapshot){
      if(this.state.selectedPoint !== this.props.context.selectedArrayField)
        this.setState({selectedPoint:this.props.context.selectedArrayField})
    }
	

  handleClick(data, index) {
    this.props.context.setSelectedArrayField({id:data['id'],field:data['fieldName']});
  }

  show_tooltip(data,payload, props){
    if(payload.length>1){
      let xInfo = <div>{props.xAxisName}: {this.convertToDate((payload[0]['value']).toString(), true)}</div>
      let yInfo = <div>{props.yAxisName}: {this.convertToDate((payload[1]['value']).toString(), true)}</div>
      if(payload[0]['name']==='index' && props.xAxisScale==='Equal distance'){
        let xValue='';
        if(payload[0]['payload'].separate  && payload[0]['payload'][props.xAxisName])
          xValue = this.convertToDate(payload[0]['payload'][props.xAxisName],props.xAxisName,true).toString();
        else
          xValue = this.convertToDate(this.getAxisValue(data,payload[0].value,props.xAxisName), true).toString();
      xInfo = <div>{props.xAxisName}: {xValue}</div>
      }
      if(payload[1]['name']==='index' && props.yAxisScale==='Equal distance'){
        let yValue='';
        if(payload[1]['payload'].separate  && payload[1][props.yAxisName])
          yValue = this.convertToDate(data,payload[1]['payload'][props.yAxisName],props.yAxisName).toString();
        else
          yValue = this.convertToDate(this.getAxisValue(data,payload[1].value,props.yAxisName), true).toString();
        yInfo = <div>{props.yAxisName}: {yValue}</div>
      }
      return <div>{xInfo}{yInfo}</div>;
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
    const xEqual = this.props.xAxisScale==='Equal distance';
    const xLog = this.props.xAxisScale==='log';
    const yEqual = this.props.yAxisScale==='Equal distance';
    let data = this.props.data;
    if(!data || !data[0]) return null; 
    //console.log(data);
    const xAxisName = this.props.xAxisName;
    let selected_records=this.props.selectedRecords;
    let ticks = xEqual ? [...Array(data.length).keys()] : data.map(r=>r[xAxisName]);    
    if(selected_records.length){
      if(xEqual){
        let indexes_array={};
        let xvalues_array = data.map(r=>r[xAxisName]);
        selected_records.forEach((record,index)=>{
          const new_key = xAxisName+index;
          xvalues_array = xvalues_array.concat(record.data.map(r=>r[xAxisName]));
        });
        xvalues_array.sort((a,b)=>{return a>b ? 1 : -1;});
        data.forEach((record,index)=>{
          data[index]['index'] = xvalues_array.findIndex(r=>r===record[xAxisName]);
        });
        selected_records.forEach((record,index)=>{
          let record_data = record['data'];
          record_data.forEach((record2,index2)=>{
            record_data[index2]['index'] = xvalues_array.findIndex(r=>r===record2[xAxisName]);
          })
          selected_records[index]['data'] = record_data;
        });
        ticks = [...Array(xvalues_array.length).keys()];
      }else{
        selected_records.forEach((record,index)=>{
          ticks = ticks.concat(record.data.map(r=>r[xAxisName]));
        });
      }
    }

    
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
          <ScatterChart
            width={600}
            height={400}
            //onMouseDown = { (e) => this.setState({refAreaLeft:e.activeLabel}) }
            //onMouseMove = { (e) => this.state.refAreaLeft && this.setState({refAreaRight:e.activeLabel}) }
            onMouseMove={(e)=>{
              if(selectedPoint && e){
                if(Math.abs(e.xValue - selectedPoint.x)<0.03 && Math.abs(e.yValue - selectedPoint.y)<0.03){
                   this.setState({selectedPointOver: true});
                   return;
                }
                if(this.state.selectedPointOver) this.setState({selectedPointOver: false});

              }
            }}
          >
            <CartesianGrid />
             
            <XAxis
              dataKey={xEqual ? 'index' : this.props.xAxisName}
              ticks={ticks}
              interval={yEqual ? 1 : 0}
              tickFormatter={(value)=>{ return xEqual ? this.convertToDate(this.getAxisValue(data,value,this.props.xAxisName)) : this.convertToDate(value)}}
              type={!xLog ? "number" : undefined}
              xAxisId='x1'
              scale={xEqual ? 'linear' : this.props.xAxisScale}
            />
           
           
            <YAxis 
              dataKey={yEqual ? 'index' : this.props.yAxisName}
              interval={yEqual ? 1 : 0}
              yAxisId='y1'
              tickFormatter={(value)=>{return yEqual ? this.convertToDate(this.getAxisValue(data,value,this.props.yAxisName)) : this.convertToDate(value)}}
              scale={yEqual ? 'linear' : this.props.yAxisScale}
             />
             
             
            <Tooltip content={(data1)=>{const value = (JSON.parse(JSON.stringify(data1))); return this.show_tooltip(data,value.payload,this.props);}} />            
            <Scatter key="key1" data={data} yAxisId="y1" line={{stroke: '#000000', strokeWidth: 1}} barSize={300}  name="l1" xAxisId="x1"   onClick={this.handleClick.bind(this)}   animationDuration={300}/>
            
            

            {selected_records.map((record,index)=>{
              const xId = xLog ? "xAxis"+index : "x1"
              return (
                [               
                  <Scatter key={"additional_record"+index} fill={record.color}
                    data={record.data} line={{stroke: record.color, strokeWidth: 1}}
                    yAxisId="y1" barSize={300}  name="l1" xAxisId="x1"   animationDuration={300}/>,
                    xLog ?  <XAxis                     
                      dataKey={ this.props.xAxisName}
                      interval={yEqual ? 1 : 0}
                      ticks={ticks}
                      hide={true}
                      xAxisId={xId}
                      scale={this.props.xAxisScale}
                    /> : null
                ]
                
              )
            })}
            {selectedPoint && !this.state.selectedPointOver && <ReferenceDot yAxisId="y1" xAxisId="x1"  x={selectedPoint.x} y={selectedPoint.y} r={4} fill="red" alwaysShow={true} isFront={true} />}

          </ScatterChart> 

      </div>
    );
  }
}


