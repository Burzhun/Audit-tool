import React from 'react';
import {Table, Icon} from 'semantic-ui-react';

import 'semantic-ui-css/semantic.min.css';
import './index.scss';
import ResizableBox from './../../components/resizableBox/ResizableBox';

class TableHeader extends React.Component {

    constructor(props) {
        super(props);
        this.state = {fields: [], sizes: {}}
        this.setColumnSize = this.setColumnSize.bind(this);
        this.handleHeaderClick = this.handleHeaderClick.bind(this);
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const sizes = prevState.sizes;
        nextProps.headerFields.map((item, i) => {
            if (!sizes[item]) {
                const ar = item.split('.');
                sizes[item] = ar.length > 1 ? ar[1].length * 6 + 45 : ar[0].length * 6 + 45;
            }
            return item
        });
        return {fields: nextProps.headerFields, sizes: sizes};
    }

    setColumnSize(item, width) {
        const sizes = this.state.sizes;
        sizes[item] = width;
        this.setState({sizes: sizes});
    }

    handleHeaderClick(e, item) {
        e.preventDefault();
        this.props.setColoredColumn(item);
    }

    getHeaderCells(headerFields, column, direction) {
        return headerFields.map((item, i) => {
            const item_name = item.indexOf('.') >= 0 ? item.slice(item.indexOf('.') + 1) : item;
            const colored = this.props.coloredColumns.includes(item);
            const className = colored ? 'yellow' : '';
            const width = this.state.sizes[item];
            return (
                <Table.HeaderCell
                    sorted={column === item ? direction : null}
                    key={`header-${i}`}
                    onClick={() => this.props.handleSort(item)}
                    className={className}
                    data-qa={item_name}
                    style={{position: 'relative', width: +width + 'px', paddingTop: '5px'}}
                >
                    <ResizableBox width={width} className="box" axis="x"
                                  minConstraints={[70, 40]} maxConstraints={[700, 500]}
                                  onResize={(e, data) => {
                                      this.setColumnSize(item, data.size.width)
                                  }}>
                        <div className={'remove_field_button 123'} style={{paddingLeft: '0px'}}>
                            <Icon name='remove circle' onClick={(ev) => {
                                ev.stopPropagation();
                                this.props.deleteField(item);
                            }}/>
                        </div>
                        <div className={'row dashboard_table_header'}>

                            <div
                                className={'col-lg-11'}
                                onContextMenu={(e) => this.handleHeaderClick(e, item)}
                                style={{maxWidth: '90%'}}
                            >
                                <span className="array_main_table_header_text">{item_name}</span>
                            </div>

                        </div>
                    </ResizableBox>
                </Table.HeaderCell>
            )
        })
    }

    render() {
        const headerCells = this.getHeaderCells(this.state.fields, this.props.column, this.props.direction);
        return (
            <Table.Header fullWidth={true}>
                <Table.Row>
                    {headerCells}
                </Table.Row>
            </Table.Header>
        )
    }
}

export default TableHeader
