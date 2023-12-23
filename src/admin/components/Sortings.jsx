import React, {useState, useEffect} from 'react';
import {
    Grid, GridRow, GridColumn, Dropdown,
    Segment,
    SegmentGroup,
    Button,
    Select, Popup
  } from 'semantic-ui-react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const Sortings=(props)=>{
    const [selectedField, setSelectedField] = useState('');
    const [sort, setSort] = useState(null);

    useEffect(()=>{
        getFieldsList();
        setSorting();
    },[props.config]);

    useEffect(()=>{
        if(props.config.DefaultSortings){
            setSubFieldsList();
            setSorting();
        }
    },[selectedField]);

    function setSorting(){
        if(!Array.isArray(props.config.DefaultSortings))
            setSort({
                ArrayFieldName : "CurrentState."+selectedField,
                SubFieldsToSort : []});
        else{
            const data = JSON.parse(JSON.stringify(props.config.DefaultSortings)).find(f=>f.ArrayFieldName==='CurrentState.'+selectedField);
            if(!data){
                setSort({
                    ArrayFieldName : "CurrentState."+selectedField,
                    SubFieldsToSort : []});
            }else setSort(data);
        } 
    }

    function getFieldsList(){
        if(props.scheme){
            var populated_fields = Array.isArray(props.config.DefaultSortings) ? props.config.DefaultSortings.map(s=>s.ArrayFieldName.replace('CurrentState.','')) : [];
            props.scheme.fields.forEach(field=>{
                const ar = field.name.split('.');                
                if(ar.length>2 && ar[0]==='CurrentState' && ar[2]==='[]'){
                    let field_name = null;
                    if(ar.length===5 && ar[4]==='[]' && field.types && field.types.find(t=>t.type==='array' || t.type==='object')){
                        field_name = ar[1]+'.'+ar[3];
                    }
                    if(ar.length===3 && ar[2]==='[]' && field.types.find(t=>t.type==='array' || t.type==='object')){
                        if(props.config.ComplexFields && props.config.ComplexFields.includes(ar[1])) return;
                        field_name = ar[1];
                    }
                    if(field_name){
                        if(!list.includes(field_name)) list.push(field_name);
                        if(!populated_fields.includes(field_name)){ empty_list.push(field_name); }
                    }
                }
            });
        }
    }

    function setSortField(name, value, index=false){
        let new_sort = Object.assign({}, sort);
        if(index!==false){
            new_sort.SubFieldsToSort[index]['SubField'] = name;
            new_sort.SubFieldsToSort[index]['Order'] = value;
        }else{
            new_sort.SubFieldsToSort.push({SubField: name, Order: value});
        }
        setSort(new_sort);
    }

    function setSubFieldsList(){
        subfields_list=[];
        if(props.scheme){
            const ar2 = selectedField.split('.');
            props.scheme.fields.forEach(field=>{
                const ar = field.name.split('.');
                if(ar.length==4 && ar[0]==='CurrentState' && ar[1]===selectedField && ar[2]==='[]'){
                    if(ar[3]!=='_id' && !subfields_list.includes(ar[3]))
                        subfields_list.push(ar[3])
                }
                if(ar.length===6 && ar[0]==='CurrentState' && ar[1]===ar2[0] && ar[3]===ar2[1]){
                    if(ar[6]!=='_id' && !subfields_list.includes(ar[5]))
                        subfields_list.push(ar[5])
                }
            });
        }
    }

    function getFreeSubFields(name){
        return [name].concat(subfields_list.filter(f=>!sort.SubFieldsToSort.find(s=>s.SubField===f)));
    }

    function removeField(index){
        let new_sort = Object.assign({}, sort);
        new_sort.SubFieldsToSort = new_sort.SubFieldsToSort.slice(0,index).concat(new_sort.SubFieldsToSort.slice(index+1));
        setSort(new_sort);
    }

    function save(){
        let new_data=[];
        if(sort.SubFieldsToSort.find(f=>f.SubField==='')){
            alert("Can't add empty field");
            return;
        }
        if(Array.isArray(props.config.DefaultSortings)){
            new_data = JSON.parse(JSON.stringify(props.config.DefaultSortings));
            const i = new_data.findIndex(f=>f.ArrayFieldName==='CurrentState.'+selectedField);
            if(i>=0)
                new_data[i] = sort;
            else new_data.push(sort);
        }else
            new_data.push(sort);
        props.updateConfg({data:new_data, field:'DefaultSortings', activeCollection:props.collection});
    }

    function onDragEnd(result) {
        if (!result.destination) {
          return;
        } 
        let list = sort.SubFieldsToSort.slice(0);
        var element = list[result.source.index];
        list.splice(result.source.index, 1);
        list.splice(result.destination.index, 0, element);
        sort.SubFieldsToSort = list
        setSort(sort);
        document.querySelector("#sorting_add_button").style.visibility='visible';
      }
    
    function onDragStart(e){
        document.querySelector("#sorting_add_button").style.visibility='hidden';
        return;
    }

    const getItemStyle = (isDragging, draggableStyle) => ({
        // some basic styles to make the items look a bit nicer
        userSelect: "none",
        padding: 16,
        margin: `0 0 8px 0`,
      
        // change background colour if dragging
        background: isDragging ? "lightgreen" : "grey",
        borderBottom:'1px solid black',
        // styles we need to apply on draggables
        ...draggableStyle
    });
      

    var empty_list=[];
    let list=[];
    var subfields_list=[];
    getFieldsList();
    setSubFieldsList();

    return (
        <React.Fragment>
            <Grid className="dashboard">
                <GridRow centered>
                    <GridColumn width={7}>
                    <Segment className="segment-dropdown">
                        <Dropdown
                        className="dropdown-main"
                        placeholder="Select Config Field..."
                        data-qa="select-config-field"
                        fluid
                        search
                        selection
                        selectOnBlur={false}
                        options={
                            props.fields_list.map((item) => ({ text: item, value: item }))
                          }
                          onChange={
                            (e, data) => props.onCollectionConfigurationSelect(
                              props.SELECT_TYPE,
                              data,
                            )
                          }
                          value={props.activeConfigurationField}
                        />
                    </Segment>
                    </GridColumn>
                </GridRow>
            </Grid>
            {props.isTabEditorActive && <SegmentGroup>
                <Segment textAlign="center" style={{width:'100%'}}>Set Sorting For Fields</Segment>
                <Segment>
                    <Grid relaxed='very' columns='equal'>
                        <Grid.Column >
                        <div className="charts-container fields-list" data-qa="charts-fields">
                            {list.map((name,index)=>{
                                const t=<div data-qa={name} key={name+'key'+index} onClick={()=>setSelectedField(name)} className={selectedField===name ? 'selected' : (empty_list.includes(name) ? 'empty' : '')}  data-qa-empty={''}>{name}</div>
                                return t;
                            })}
                        </div>
                        </Grid.Column>
                        <Grid.Column width={9}>

                            {selectedField && sort &&
                                <div className="validators-container values-list" data-qa="validators-values">
                                    <DragDropContext  onDragUpdate={onDragStart} onDragEnd={onDragEnd} >
                                        <Droppable droppableId="droppable">
                                        {(provided, snapshot) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef}>
                                            {sort.SubFieldsToSort.map((sort_object, index)=>(
                                                <Draggable key={'drag_key_'+sort_object.SubField} draggableId={sort_object.SubField+index} index={index}>
                                                 {(provided, snapshot) => (
                                                <div ref={provided.innerRef} style={getItemStyle(snapshot.isDragging,provided.draggableProps.style)} {...provided.draggableProps} {...provided.dragHandleProps} key={'sort_field'+index} >                                        
                                                    <span className="names-column">Field </span>
                                                        <Select style={{minWidth:'400px'}} search options={
                                                            getFreeSubFields(sort_object.SubField).map((item) => ({ text: item, value: item })) 
                                                        } value={sort_object.SubField} data-qa="field-name" onChange={(e, data)=>{setSortField(data.value, sort_object.Order, index)}} className="values-column" /> 
                                                    <Button onClick={()=>removeField(index)} >Remove Field</Button>                                            
                                                    <br />
                                                    <span className="names-column">Order </span>
                                                        <Select style={{minWidth:'400px'}} search options={
                                                            ['ascending', 'descending'].map((item) => ({ text: item, value: item })) 
                                                        } value={sort_object.Order} data-qa="field-name" onChange={(e, data)=>{setSortField(sort_object.SubField, data.value, index)}} className="values-column" /> 
                                                </div>
                                                )}
                                                </Draggable>
                                            ))}
                                            <Button id="sorting_add_button" onClick={()=>setSortField('','ascending')} >Add Field</Button>
                                        
                                        </div>
                                        )}
                                        </Droppable>
                                    </DragDropContext>
                              </div>
                            }
                        </Grid.Column>
                        <br />
                    <GridRow style={{marginLeft:'30px'}}>
                        <Button data-qa="cancel-validator" onClick={()=>{setSorting()}}>Cancel</Button>
                        <Button data-qa="save-validator" onClick={()=>{save()}} style={{marginLeft: '20px'}}>Save</Button>
                    </GridRow>
                    </Grid>
                </Segment>
            </SegmentGroup>}
        </React.Fragment>
    )
}

export default Sortings;