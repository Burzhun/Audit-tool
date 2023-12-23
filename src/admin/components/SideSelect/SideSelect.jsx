import React from 'react';
import {
  GridColumn,
  GridRow,
  Grid,Checkbox, Input
} from 'semantic-ui-react';
import cn from 'classnames';
import './SideSelect.scss';
import SideSelectGroup from './SideSelectGroup';
import SideSelectButtons, { BUTTON_TYPE } from './SideSelectButtons';

const COLUMN_TYPE = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
};

class SideSelect extends React.Component {
  static stateNameMapper = {
    LEFT: 'leftColumnSelection',
    RIGHT: 'rightColumnSelection',
  };

  static propNameMapper = {
    LEFT: 'leftColumn',
    RIGHT: 'rightColumn',
  };

  static buttonColumnMapper = {
    LEFT: {
      FROM: COLUMN_TYPE.RIGHT,
      TO: COLUMN_TYPE.LEFT,
    },
    RIGHT: {
      FROM: COLUMN_TYPE.LEFT,
      TO: COLUMN_TYPE.RIGHT,
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      leftColumnSelection: [],
      rightColumnSelection: [],
      movedFields: [],
      on: props.editorSelection.on,
      imageLinks: props.editorSelection.imageLinks && props.editorSelection.imageLinks!==null ? Object.keys(props.editorSelection.imageLinks).join(', ') : 
        (this.props.activeConfigurationField==='add_new_record' ? [] : null)
    };
  }

  onSelection = (column, items) => {
    const stateName = SideSelect.stateNameMapper[column];
    var state = {};
    state[stateName] = [...new Set(items)];
    this.setState(state);
  };

  componentDidUpdate(){
    
  }

  onMoveSelection = (buttonType) => {
    if(buttonType==='on'){
      const columnsFromTo = SideSelect.buttonColumnMapper[BUTTON_TYPE.LEFT];
      const sourcePropName = SideSelect.propNameMapper[columnsFromTo.FROM];
      const targetPropName = SideSelect.propNameMapper[columnsFromTo.TO];
      const stateName = SideSelect.stateNameMapper[columnsFromTo.FROM];
      let props_data = {}
      props_data[sourcePropName] = this.props[sourcePropName].items;
      props_data[targetPropName] = this.props[sourcePropName].items;
      props_data.on = this.state.on;
      props_data.imageLinks = this.setImageLinks(this.state.imageLinks);
      
      this.props.onChange(props_data, true);
      return;
    }

    const columnsFromTo = SideSelect.buttonColumnMapper[buttonType];
    const sourcePropName = SideSelect.propNameMapper[columnsFromTo.FROM];
    const targetPropName = SideSelect.propNameMapper[columnsFromTo.TO];
    const stateName = SideSelect.stateNameMapper[columnsFromTo.FROM];

    let props_data = {};
    props_data[sourcePropName] = this.props[sourcePropName].items.filter((item) => !this.state[stateName].includes(item));
    props_data[targetPropName] = [...this.props[targetPropName].items, ...this.state[stateName]];
    props_data.on = this.state.on;
    props_data.imageLinks = this.setImageLinks(this.state.imageLinks);

    
    
    let new_state = {}
    new_state[stateName] = [];
    new_state.movedFields = [...this.state.movedFields, ...this.state[stateName]];
    this.setState(new_state);
    
    this.props.onChange(props_data, true);
  };

  onSelectionSort = (column, items) => {
    const sortedColumnPropName = SideSelect.propNameMapper[column];
    const otherColumnPropName = ({
      LEFT: SideSelect.propNameMapper[COLUMN_TYPE.RIGHT],
      RIGHT: SideSelect.propNameMapper[COLUMN_TYPE.LEFT],
    })[column];
    
    const inputItems = this.props[sortedColumnPropName].items;
    const isChanged = items.some((item, index) => (
      item !== inputItems[index]
    ));

    if (!isChanged) return;

    this.setState({
      movedFields: []
    });


    let props_data = {};
    props_data[sortedColumnPropName] = items;
    props_data[otherColumnPropName] = this.props[otherColumnPropName].items;
    props_data.on = this.state.on;
    props_data.imageLinks = this.setImageLinks(this.state.imageLinks);
   
    this.props.onChange(props_data, true);
  };

  setImageLinks(value){
    let data={};
    if(value==='') return {};
    if(!value) return null;
    if(Array.isArray(value)) return value;
    value.split(',').forEach(key=>{
      if(key[0]===' ') key = key.replace(' ','');
      data[key] = [];
    });
    return data;
  }

  render() {
    const {
      leftColumn,
      rightColumn,
      disabled,
      rightColumnSortable,
      leftColumnSortable,
    } = this.props;

    const { leftColumnSelection, rightColumnSelection } = this.state;
    let fields = this.props.scheme ? this.props.scheme.fields.filter(f=>{
      const ar = f.name.split('.');
      if(ar.length>1 && (ar[0]==='CurrentState' || ar[0]==='AuditState')) return true; else return false; 
    }).map(f=>f.name.replace('CurrentState.','').replace('AuditState.','').replace(/\.\[\]/g,'')).filter(f=>{ return f[f.length-1]!==']'}) : [];
    if(this.props.activeConfigurationField==='SearchFieldNames'){
      fields = fields.filter(f=>f.indexOf('.')<0);
      leftColumn.items = leftColumn.items.filter(f=>f.indexOf('.')<0);
      rightColumn.items = rightColumn.items.filter(f=>f.indexOf('.')<0);
    } 
    return (
      <Grid
        className={
          cn('side-select', {
            disabled,
          })
        }
      >
        {this.props.activeConfigurationField==='add_new_record' && 
          <GridRow>
            <Checkbox
              label="On"
              style={{marginLeft:'20px'}}
              checked={this.state.on}
              onChange={(e, data) => {this.setState({on:data.checked===true},()=>{this.onMoveSelection('on')});}}
            />
          </GridRow>
        }

        <GridRow>
          <GridColumn width={6}>
            <SideSelectGroup
              title={leftColumn.title}
              items={leftColumn.items}
              movedFields={this.state.movedFields}
              activeConfigurationField={this.props.activeConfigurationField}
              selection={leftColumnSelection}
              all_fields={fields.concat('RecordId')}
              dataQa="unselected"
              onSelection={(items) => this.onSelection(COLUMN_TYPE.LEFT, items)}
              disabled={disabled}
              onSort={
                leftColumnSortable
                  ? (items) => this.onSelectionSort(COLUMN_TYPE.LEFT, items)
                  : undefined
              }
            />
          </GridColumn>
          <GridColumn width={4} verticalAlign="middle" textAlign="center">
            <SideSelectButtons
              onClick={this.onMoveSelection}
              disabledLeft={!rightColumnSelection.length || disabled}
              disabledRight={!leftColumnSelection.length || disabled}
            />
          </GridColumn>
          <GridColumn width={6}>
            <SideSelectGroup
              title={rightColumn.title}
              items={rightColumn.items}
              movedFields={this.state.movedFields}
              activeConfigurationField={this.props.activeConfigurationField}
              selection={rightColumnSelection}
              dataQa="selected"
              onSelection={(items) => this.onSelection(COLUMN_TYPE.RIGHT, items)}
              all_fields={fields.concat('RecordId')}
              disabled={disabled}
              onSort={
                rightColumnSortable
                  ? (items) => this.onSelectionSort(COLUMN_TYPE.RIGHT, items)
                  : undefined
              }
            />
            {this.state.imageLinks!==null && 
              <div>
              <div style={{color:'red',fontSize:'15px'}}>`ImageLinks` keys to add</div>
              <Input style={{ width:'300px'}} value={this.state.imageLinks} onChange={(e, data)=>this.setState({imageLinks: data.value},()=>{this.onMoveSelection('on')})} />            
              </div>
            }
          </GridColumn>
        </GridRow>
      </Grid>
    );
  }
}

export default SideSelect;
