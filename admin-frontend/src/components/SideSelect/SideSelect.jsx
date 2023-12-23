import React from 'react';
import {
  GridColumn,
  GridRow,
  Grid,
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
    [COLUMN_TYPE.LEFT]: 'leftColumnSelection',
    [COLUMN_TYPE.RIGHT]: 'rightColumnSelection',
  };

  static propNameMapper = {
    [COLUMN_TYPE.LEFT]: 'leftColumn',
    [COLUMN_TYPE.RIGHT]: 'rightColumn',
  };

  static buttonColumnMapper = {
    [BUTTON_TYPE.LEFT]: {
      FROM: COLUMN_TYPE.RIGHT,
      TO: COLUMN_TYPE.LEFT,
    },
    [BUTTON_TYPE.RIGHT]: {
      FROM: COLUMN_TYPE.LEFT,
      TO: COLUMN_TYPE.RIGHT,
    },
  };

  constructor(props) {
    super(props);
    this.state = {
      leftColumnSelection: [],
      rightColumnSelection: [],
    };
  }

  onSelection = (column, items) => {
    const stateName = SideSelect.stateNameMapper[column];

    this.setState({
      [stateName]: [...items],
    });
  };

  onMoveSelection = (buttonType) => {
    const columnsFromTo = SideSelect.buttonColumnMapper[buttonType];
    const sourcePropName = SideSelect.propNameMapper[columnsFromTo.FROM];
    const targetPropName = SideSelect.propNameMapper[columnsFromTo.TO];
    const stateName = SideSelect.stateNameMapper[columnsFromTo.FROM];

    const {
      [sourcePropName]: sourceColumn,
      [targetPropName]: targetColumn,
      onChange,
    } = this.props;

    const {
      [stateName]: selection,
    } = this.state;

    this.setState({
      [stateName]: [],
    });
    onChange({
      [sourcePropName]: sourceColumn.items.filter((item) => !selection.includes(item)),
      [targetPropName]: [...targetColumn.items, ...selection],
    });
  };

  onSelectionSort = (column, items) => {
    const sortedColumnPropName = SideSelect.propNameMapper[column];
    const otherColumnPropName = ({
      [COLUMN_TYPE.LEFT]: SideSelect.propNameMapper[COLUMN_TYPE.RIGHT],
      [COLUMN_TYPE.RIGHT]: SideSelect.propNameMapper[COLUMN_TYPE.LEFT],
    })[column];
    const {
      [sortedColumnPropName]: { items: inputItems },
    } = this.props;

    const isChanged = items.some((item, index) => (
      item !== inputItems[index]
    ));

    if (!isChanged) return;

    const {
      [otherColumnPropName]: unchangedColumn,
      onChange,
    } = this.props;

    onChange({
      [sortedColumnPropName]: items,
      [otherColumnPropName]: unchangedColumn.items,
    });
  };

  render() {
    const {
      leftColumn,
      rightColumn,
      disabled,
      rightColumnSortable,
      leftColumnSortable,
    } = this.props;

    const { leftColumnSelection, rightColumnSelection } = this.state;

    return (
      <Grid
        className={
          cn('side-select', {
            disabled,
          })
        }
      >
        <GridRow>
          <GridColumn width={6}>
            <SideSelectGroup
              title={leftColumn.title}
              items={leftColumn.items}
              selection={leftColumnSelection}
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
              selection={rightColumnSelection}
              dataQa="selected"
              onSelection={(items) => this.onSelection(COLUMN_TYPE.RIGHT, items)}
              disabled={disabled}
              onSort={
                rightColumnSortable
                  ? (items) => this.onSelectionSort(COLUMN_TYPE.RIGHT, items)
                  : undefined
              }
            />
          </GridColumn>
        </GridRow>
      </Grid>
    );
  }
}

export default SideSelect;
