import React from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  Segment,
  SegmentGroup,
  Input,
  Icon,
} from 'semantic-ui-react';
import cn from 'classnames';
import { ReactSortable } from 'react-sortablejs';
import './SideSelectGroup.scss';

const DROPDOWN_VALUES = {
  SELECT_ALL: 'SELECT_ALL',
  UNSELECT_ALL: 'UNSELECT_ALL',
};

const dropdownOptions = [
  { text: 'Select All', value: DROPDOWN_VALUES.SELECT_ALL },
  { text: 'Unselect All', value: DROPDOWN_VALUES.UNSELECT_ALL },
];

class SideSelectGroup extends React.Component {
  static filterItems(items, search) {
    return search
      ? items.filter((item) => item
        .toLowerCase()
        .includes(search.toLowerCase()))
      : items;
  }

  constructor(props) {
    super(props);

    this.state = {
      search: '',
      extended_field:[]
    };
  }

  onItemClick = (item) => {
    const { selection, onSelection } = this.props;

    const newSelection = selection.includes(item)
      ? [...selection.filter((v) => item !== v)]
      : [...selection, item];

    onSelection(newSelection);
  };

  onComplexItemClick = (item) => {
    if(!this.state.extended_field.includes(item)){
      this.setState({extended_field:this.state.extended_field.concat([item])});
    }else{
      let array = this.state.extended_field;
      var index = array.indexOf(item);
      array.splice(index, 1);
      this.setState({extended_field:array});      
    }
  };

  onDropdownItemClick = (data) => {
    const { items, selection, onSelection } = this.props;
    let newSelection;

    switch (data.value) {
      case DROPDOWN_VALUES.SELECT_ALL:
        newSelection = [...items];
        break;
      case DROPDOWN_VALUES.UNSELECT_ALL:
        newSelection = [];
        break;
      default:
        newSelection = [...selection];
    }

    onSelection(newSelection);
  };

  Sortable = (props) => (
    <ReactSortable
      list={
        props.items.map((item) => ({
          id: item,
          name: item,
        }))
      }
      setList={(sortedItems) => (
        props.onSort(sortedItems.map((item) => item.name))
      )}
      handle=".handle"
      ghostClass="drop-place"
      animation={150}
    >
      {props.children}
    </ReactSortable>
  );

  renderItems = () => {
    const { selection, onSort, items: rawItems } = this.props;
    const { search } = this.state;
    const { Sortable } = this;
    let items = SideSelectGroup.filterItems(rawItems, search);
    const isSortable = !!(onSort && !search);
    let top_field_names = [];
    let sub_keys=[];
    items.forEach((item,key)=>{
      if(item['name'] && item['DefaultFieldsToDisplayInAuditSession']){
        item['DefaultFieldsToDisplayInAuditSession'].forEach(subField=>{
          const new_field = item['name']+'.'+subField;
          if(!sub_keys.includes(new_field)) sub_keys.push(new_field);
        })
      }
    })
    items = items.filter(it=>{return typeof it==='string'}).concat(sub_keys);
    let complex_fields_list = items.slice(0).reduce(function (accumulator, currentValue) {
      if(typeof currentValue==='string' && currentValue.indexOf('.')>0){
        let t = currentValue.split('.')[0];
        if(!top_field_names.includes(t)){
          top_field_names.push(t); 
        }
        accumulator.push(currentValue);
      }
      return accumulator;
    }, []);   
    let new_items = items.filter(it=>!complex_fields_list.includes(it) && !top_field_names.includes(it));
    
    let renderedItems = new_items.map((item) => (
      <Segment
        className={
          cn('select-item', {
            selected: selection.includes(item),
          })
        }
        data-qa={selection.includes(item) ? 'item-selected':'item-not-selected'}
        data-qa-type="non-dict-type"
        vertical
        key={item}
        onClick={() => this.onItemClick(item)}
      >
        {isSortable && (<Icon name="sort" className="handle" />)}
        {item}
      </Segment>
    ));

    top_field_names.forEach(item=>{
      const subFields = items.filter(it=>it.includes(item+'.'));
      if(!subFields.length) return;
      const display = this.state.extended_field.includes(item);
      new_items.push(item);
      renderedItems.push(<Segment
        className={
          cn('select-item', {
            selected: selection.includes(item),
          })
        }
        vertical
        key={item}
        onClick={() => this.onComplexItemClick(item)}
        data-qa={selection.includes(item) ? 'item-selected' : 'item-not-selected'}
        data-qa-type="dict-type"
        data-qa-extended={this.state.extended_field.join("-")}
      >
        {item}
        <Icon name={"angle "+ (display ? 'up' : 'down')} />
      </Segment>);
      subFields.forEach(item2=>{
        new_items.push(item2);
        renderedItems.push(<Segment
          className={
            cn('select-item', {
              selected: selection.includes(item2),
            })
          }
          vertical
          style={{display:display ? 'block' : 'none', paddingLeft:'25px'}}
          onClick={() => this.onItemClick(item2)}
          key={item2}
          data-qa={selection.includes(item2) ? 'item-selected' : 'item-not-selected'}
          data-qa-type="sub-field"
          data-qa-parent={item}
        >
          {isSortable && (<Icon name="sort" className="handle" />)}
          {item2}
        </Segment>
        );
      })
    
  }); 
    return isSortable
      ? (<Sortable items={new_items} onSort={onSort}>{renderedItems}</Sortable>)
      : renderedItems;
  };

  render() {
    const {
      title,
      disabled,
      dataQa,
    } = this.props;

    const { search } = this.state;

    return (
      <SegmentGroup
        className={
          cn('select-group', {
            disabled,
          })
        }
      >
        <Segment className="select-header" textAlign="center">
          <Dropdown
            trigger={title}
            selectOnBlur={false}
            data-qa={`${dataQa} select-header`}
          >
            <DropdownMenu>
              {
                dropdownOptions.map((item) => (
                  <DropdownItem
                    text={item.text}
                    value={item.value}
                    key={item.value}
                    onClick={(e, data) => this.onDropdownItemClick(data)}
                  />
                ))
              }
            </DropdownMenu>
          </Dropdown>
        </Segment>
        <Segment className="select-search" data-qa={dataQa}>
          <Input
            placeholder="Search items..."
            icon="search"
            iconPosition="left"
            fluid
            value={search}
            onChange={(e) => this.setState({ search: e.target.value })}
            action={
              search
                ? {
                  icon: 'close',
                  onClick: () => this.setState({ search: '' }),
                }
                : undefined
            }
          />
        </Segment>
        <Segment className="select-container" data-qa={dataQa}>
          {this.renderItems()}
        </Segment>
      </SegmentGroup>
    );
  }
}

export default SideSelectGroup;
