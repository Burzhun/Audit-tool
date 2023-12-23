import React from 'react';
import {Input, Table, Button, Icon, Label, Dropdown} from 'semantic-ui-react';

import 'semantic-ui-css/semantic.min.css';
import './index.scss';
import {connect} from 'react-redux';
import _ from 'lodash';
import TableHeader from './Header'
import {deleteField} from '../../actions/index'
import DoubleScrollbar from 'react-double-scrollbar';
import ReactPaginate from 'react-paginate';
import {setUserConfig} from '../../lib/api';


function getItemPath(key, value, item) {
    if (key.includes('.')) {
        const splitKey = key.split('.');
        value = item[splitKey[0]] ? item[splitKey[0]][splitKey[1]] : null;
        if (value === null && value !== 0 && item.AuditState) {
            value = item.AuditState[key] ? item.AuditState[key] : null
        }
    } else {
        value = item[key];
    }
    return value;
}

class SearchTable extends React.Component {

    constructor(props) {
        super(props);
        let view;
        
        if ((new URLSearchParams(window.location.search)).get('fields')) {
            view = 'default';
        } else {
            view = localStorage.getItem('view') || 'default';
        }
        
        this.state = {
            data: [],
            column: null,
            direction: null,
            currentData: null,
            filters: {},
            colored_columns: [],
            fields: [],
            view,
        }
        this.handleSort = this.handleSort.bind(this);
        this.onFilter = this.onFilter.bind(this);
        this.deleteField = this.deleteField.bind(this);
        this.setColoredColumn = this.setColoredColumn.bind(this);
        this.showAll = this.showAll.bind(this);
        this.setDefaultView = this.setDefaultView.bind(this);
    }

    componentDidMount() {
        let headerFields = this.props.config.DefaultFieldsToDisplayInSearchResultView;
        if(!window.location.search.includes('&fields=')){
            if(this.props.config.user_config && this.props.config.user_config.DefaultFieldsToDisplayInSearchResultView)
                headerFields = this.props.config.user_config.DefaultFieldsToDisplayInSearchResultView;
            if(!headerFields.length) headerFields = this.props.config.DefaultFieldsToDisplayInSearchResultView;
            else this.props.addSearchField(headerFields)
            this.setState({data: this.props.data, fields: headerFields});
        }else{
            this.setState({data: this.props.data, fields: this.props.fields});
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.fields !== prevProps.fields) {
            this.setState({fields: this.props.fields})
        }
        if (this.props.data !== prevProps.data) {
            this.setState({data: this.props.data})
        }
        // if(this.props.fields.length!==prevProps.fields.length){
		// }
        if(prevProps.collectionName !== this.props.collectionName && prevProps.collectionName!==''){
            this.setState({ fields: this.props.config.DefaultFieldsToDisplayInSearchResultView});
        }
    }

    handleSort(clickedColumn) {
        const {column, data, direction} = this.state
        if (column !== clickedColumn) {
            this.setState({
                column: clickedColumn,
                direction: 'ascending',
            })
            this.props.setSorting(clickedColumn,'ascending');

            return
        }
        this.setState({
            direction: direction === 'ascending' ? 'descending' : 'ascending',
        })
        this.props.setSorting(clickedColumn,direction === 'ascending' ? 'descending' : 'ascending');

    }

    filterHandler(filters, item, key) {
        let result = false;
        let value = item[key] || item[key] === false ? item[key] : null;
        value = getItemPath(key, value, item);
        if (value === false && 'false'.includes(filters[key])) return true;
        if (filters[key] === '---' || filters[key] === 'null') {
            return value === null;
        }
        if (value === true && 'true'.includes(filters[key])) return true;
        if (typeof value === 'string') {

            result = value.toLowerCase().indexOf(filters[key].toLowerCase()) >= 0
        }
        if (typeof value === 'number') {
            value = value.toString();
            result = value.indexOf(filters[key]) >= 0
        }
        return result
    }

    setColoredColumn(item, e = false) {
        if (e) e.preventDefault();
        let columns = this.state.colored_columns;
        if (columns.includes(item)) {
            const index = columns.indexOf(item);
            columns.splice(index, 1);
        } else {
            columns.push(item);
        }
        this.setState({colored_columns: columns});
    }


    onFilter(ev, value) {
        const data = this.props.data;
        let filters = this.state.filters;
        let filtered = data;
        if (ev.target.value) {
            filters[ev.target.id] = ev.target.value
        } else if (ev.target.id in filters) {
            delete filters[ev.target.id]
        }
        const validators = this.props.config.Validators;
        Object.keys(filters).forEach((filter_key) => {
            const name = filter_key.indexOf('.') > 0 ? filter_key.split('.')[1] : filter_key;
            const validator = validators.find(v => v['name'] === name);
            if (!validator) return;
            if (validator['type'] === 'bool') {
                if ('true'.includes(filters[filter_key])) filters[filter_key] = true;
                else {
                    if ('false'.includes(filters[filter_key])) filters[filter_key] = false;
                }
            }
            if (validator['type'] === 'string') {

                filters[filter_key] = filters[filter_key].toLowerCase();
            }
            if (typeof value === 'number') {
                filters[filter_key] = filters[filter_key].toString();
            }
        })
        this.props.setTableFilters(filters);
    }


    extractRows(column, direction, rows, data) {
        const headerFields = this.state.fields
        const filters = headerFields.map((fieldHead, k) => {
            return (
                <Table.Cell key={`filter-cell-${k}`}>
                    <Input
                        className='filterInput'
                        id={fieldHead}
                        onChange={this.onFilter}
                        icon='search'
                    />
                </Table.Cell>
            )
        })

        rows.push(
            <Table.Row
                key={'filter-table-row'}
                className='tableRow'
            >
                {filters}
            </Table.Row>
        )
        data.map((element, i) => {
            let cells = [];
            const last_session = element.AuditSessions.filter(item => item.AuditType !== 'external audit').pop();
            for (var j = 0; j < headerFields.length; j++) {
                const item = headerFields[j]
                let value = element[item];
                if (item.indexOf('.') >= 0) {
                    var pos = item.indexOf('.');
                    var collection_name = item.slice(0, pos);
                    var collection_key = item.slice(pos + 1);
                    if (last_session && collection_name === 'AuditState') {
                        if(collection_key==='ConfidenceScore' && this.props.config.ConfidenceScores && this.props.config.ConfidenceScores.ConfidenceScoreOptions){
                            if (collection_name in element)
                                value = element[collection_name][collection_key];
                            else{
                                const options = this.props.config.ConfidenceScores.ConfidenceScoreOptions;
                                let t = last_session[collection_key] ? last_session[collection_key] : '';
                                if(t) value = Object.keys(options).find(key=>options[key]===t);
                            }
                        }
                        else{
                            if (collection_key in last_session)
                                value = last_session[collection_key];
                            else {
                                if (collection_key === 'LastEditedAt')
                                    value = last_session.AuditDate;
                                if (collection_key === 'LastEditedBy')
                                    value = last_session.RegisteredUserEmail;
                            }
                        }
                    } else {
                        
                        if (collection_name in element)
                            value = element[collection_name][collection_key];
                        if(Array.isArray(value)) value = value.toString();
                    }

                }
                if (!value && value !== false && value !== 0) {
                    value = '---'
                }
                const colored = this.state.colored_columns.includes(item);
                const className = colored ? 'yellow' : '';
                if(typeof value==='object') continue;

                if (typeof value === 'boolean') {
                    value = String(value)
                }
                cells.push(
                    <Table.Cell className={className} key={`${j}-${i}`}
                                onContextMenu={(e) => this.setColoredColumn(item, e)}
                                name={`${headerFields[j]}-${value}`}>{value}</Table.Cell>
                )
            }
            rows.push(<Table.Row
                key={i} className={'tableRow ' + (element.clicked === 1 ? 'clicked' : '')}
                onClick={() => this.onRowClick(element)}
            >{cells}
            </Table.Row>)
            return i
        })
        return rows;
    }

    onRowClick(element) {
        let data = this.state.data;
        if ((element.RecordId || element.RecordId === 0) && element.CurrentState) {
            const element_index = data.findIndex(e => e.RecordId === element.RecordId);
            data[element_index].clicked = 1;
            this.setState({data: data});
            window.open(`/detail/${this.props.collectionName}/${element.RecordId}`, '_blank')
        }
    }

    showAll() {
        let data = this.state.data;
        for (var i = 0; i < data.length; i++) {
            const element = data[i];
            if ((element.RecordId || element.RecordId === 0) && element.CurrentState) {
                data[i].clicked = 1;
                const url = `/detail/${this.props.collectionName}/${element.RecordId}`;
                setTimeout(function () {
                    window.open(url, '_blank');
                }, i * 100);
            }
        }
        this.setState({data: data});

    }


    deleteField(item) {
        let fields = this.state.fields.slice(0);
        const index = fields.indexOf(item);
        if (index !== -1) fields.splice(index, 1);
        this.props.deleteField(fields);
        this.setState({fields: fields, dirty: true});
        this.props.updateUrl(fields);
    }

    setDefaultView(){
        const fields = this.props.config.DefaultFieldsToDisplayInSearchResultView;
        this.props.deleteField(fields);
        this.setState({fields: fields});
        this.props.updateUrl(fields);
    }
    
    setCustomView() {
        const fields = this.props.config.user_config.DefaultFieldsToDisplayInSearchResultView;
        this.props.deleteField(fields);
        this.setState({ fields });
        this.props.updateUrl(fields);
    }
    
    changeView(view) {
        this.setState({
            ...this.state,
            view,
        });
        if (view === 'default') {
            this.setDefaultView();
        } else {
            this.setCustomView();
        }
        localStorage.setItem('view', view);
    }

    render() {
        let {column, data, direction, fields} = this.state;
        
        if (this.state.view !== 'default' && this.props.config.user_config && this.props.config.user_config.DefaultFieldsToDisplayInSearchResultView && !this.state.dirty) {
            fields = this.props.config.user_config.DefaultFieldsToDisplayInSearchResultView
        }
        
        let rows = [];
        
        if (this.props.config && this.props.config.DefaultFieldsToDisplayInSearchResultView) {
            rows = this.extractRows(column, direction, rows, data);
        }
        
        let add_options = [];
        
        if (this.props.data[0] && this.props.data[0].CurrentState && fields) {
            Object.keys(this.props.data[0].CurrentState).map(field => {
                if (!fields.includes(field)) {
                    add_options.push({text: field, value: field})
                }
                return field;
            });
        }
        
        return (
            <React.Fragment>
                <div data-qa="show-all-records" name='found_records' style={{marginTop: '5px'}}>{this.props.records_count} records found <Button
                    onClick={() => this.showAll()}>Show all records</Button></div>
                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <div>
                        {this.props.pages_count > 1 && <ReactPaginate
                          previousLabel={'prev'}
                          nextLabel={'next'}
                          breakLabel={'...'}
                          breakClassName={'break-me'}
                          pageCount={this.props.pages_count}
                          marginPagesDisplayed={2}
                          pageRangeDisplayed={5}
                          onPageChange={this.props.handlePageClick}
                          forcePage={this.props.page_number - 1}
                          containerClassName={'pagination'}
                          subContainerClassName={'pages pagination'}
                          activeClassName={'active'}
                        />}
                        <Icon aria-label='Reload' onClick={()=>this.props.handlePageClick({selected: this.props.page_number-1})} name="redo" color="green" />
                    </div>
                    <span style={{display: 'flex', alignItems: 'flex-end', alignSelf: 'flex-end'}}>
                        <Button
                          color="teal"
                          data-qa="set-config-field"
                          onClick={()=>{
                              setUserConfig({DefaultFieldsToDisplayInSearchResultView:this.state.fields}, this.props.collectionName).then(() => {
                                  this.props.getConfig();
                                  setTimeout(() => {
                                      this.changeView('personalised');
                                  }, 1500);
                              });
                            }
                          }
                        >
                            Save&nbsp;User&nbsp;View
                        </Button>
                        &nbsp;
                        <Dropdown
                          placeholder="Select view"
                          fluid
                          selection
                          value={this.state.view}
                          onChange={(e, { value }) => {
                              this.changeView(value);
                          }}
                          options={[
                              {
                                  key: 'default',
                                  text: 'Default view',
                                  value: 'default',
                              },
                              {
                                  key: 'personalised',
                                  text: 'Personalised view',
                                  value: 'personalised',
                              },
                          ]}
                        />
                    </span>
                </div>
                
                <br />
                
                <DoubleScrollbar>
                    <Table striped sortable celled fixed style={{maxWidth: '100%'}}>
                        <TableHeader
                            headerFields={fields}
                            column={column}
                            direction={direction}
                            handleSort={this.handleSort}
                            deleteField={this.deleteField}
                            coloredColumns={this.state.colored_columns}
                            setColoredColumn={this.setColoredColumn}
                        />
                        <Table.Body>
                            {rows}
                        </Table.Body>
                    </Table>
                </DoubleScrollbar>
                {this.props.pages_count > 1 && <ReactPaginate
                    previousLabel={'prev'}
                    nextLabel={'next'}
                    breakLabel={'...'}
                    breakClassName={'break-me'}
                    pageCount={this.props.pages_count}
                    marginPagesDisplayed={2}
                    pageRangeDisplayed={5}
                    onPageChange={this.props.handlePageClick}
                    forcePage={this.props.page_number - 1}
                    containerClassName={'pagination'}
                    subContainerClassName={'pages pagination'}
                    activeClassName={'active'}
                />}
            </React.Fragment>
        )
    }
}

const mapStateToProps = state => ({
    data: state.dataReducer.data,
    config: state.dataReducer.config,
});

const mapDispatchToProps = dispatch => ({
    deleteField: (fields) => dispatch(deleteField(fields)),
});

export default connect(mapStateToProps, mapDispatchToProps)(SearchTable);
