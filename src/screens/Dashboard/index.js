import React, { Component } from "react";
import { connect } from "react-redux";
import { Button } from "semantic-ui-react";
import _ from "lodash";
import GlobalUpdateButton from "../../components/globalUpdate/globalUpdateButton";
import { getDataByFirmID, getConfig, addSearchField, getConfigs, addRecord } from "../../actions";

import "semantic-ui-css/semantic.min.css";
import "./index.scss";
import SearchTable from "./Table";
import ConfigSelector from "./configSelector";
import SearchFilterList from "./SearchFilterList";
import AddFieldSelector from "./AddFieldSelector";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const PAGE_SIZE = 20;

export class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            firmID: "",
            config_name: "",
            loading: false,
            page_number: 1,
            pages_count: 0,
            data: [],
            fields: [],
            url_fields: [],
            column: null,
            direction: null,
            fieldToAdd: "",
            currentData: null,
            detail_dialog_status: false,
            search_values: {},
            filters: [],
            table_filters: [],
            show_table: false,
            selectedSearchField: "",
            searchValue: "",
            secondSearchValue: "",
            query_operator: "=",
            records_count: 0,
            searchFields: [],
            pipeline_message: "Update Calculated Fields"
        };
        this.searchItem = this.searchItem.bind(this);
        this.updateConfig = this.updateConfig.bind(this);

        this.saveData = this.saveData.bind(this);
        this.addField = this.addField.bind(this);
        this.handlePageClick = this.handlePageClick.bind(this);
        this.setTableFilters = this.setTableFilters.bind(this);
        this.setSorting = this.setSorting.bind(this);
    }

    componentDidMount() {
        if (this.props.isAuthenticated === false) {
            this.props.history.push("/");
        }
        // this.props.getConfig();
        if (window.location.search.includes("&fields=")) {
            let s = window.location.search.split("&").find((f) => f.startsWith("fields="));
            if (s) {
                s = s.replace("fields=", "");
                const fields = s.split(",").map((f) => decodeURIComponent(f));
                this.props.addSearchField(fields);
                this.setState({ url_fields: fields });
            }
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.configs.length && prevProps.configs.length === 0) {
            const { search } = window.location;
            if (search && search.startsWith("?config=")) {
                const config_name = search.split("&")[0].replace("?config=", "");
                if (config_name) this.updateConfig(config_name);
            }
        }

        if (this.props.isAuthenticated === false) {
            this.props.history.push("/");
        }
        if (this.props.config && this.props.config.SearchFieldNames) {
            this.setSearchFields(this.props);
            if (!prevProps.fields.length && this.props.config.DefaultFieldsToDisplayInSearchResultView)
                this.props.addSearchField(this.props.config.DefaultFieldsToDisplayInSearchResultView);
        }
        if (this.props.data.length && !prevState.show_table && prevState.loading) {
            this.setState({ show_table: true, loading: false });
        }
        if (this.props.collectionName !== prevProps.collectionName) {
            this.setState({ data: [] });
        }
        if (!prevProps.fields.length && this.props.fields.length && this.state.url_fields.length) {
            this.props.addSearchField(this.state.url_fields);
            this.setState({ fields: this.state.url_fields });
        }
    }

    updateConfig(config) {
        if (this.state.config_name && window.location.search.startsWith("?config=")) {
            window.history.pushState(null, document.title, window.location.href.split("?")[0]);
        }
        this.setState({
            config_name: config,
            show_table: false,
            searchValue: "",
            data: [],
            filters: [],
            page_number: 1
        });
        this.props.getConfig(config);
    }

    handlePageClick(e) {
        this.setState(
            {
                page_number: e.selected + 1
            },
            () => {
                const sorting_data = this.state.column ? { column: this.state.column, direction: this.state.direction } : null;
                this.props.getData(this.state.filters, this.state.table_filters, sorting_data, this.props.collectionName, this.state.page_number, PAGE_SIZE);
            }
        );
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        const temp_dat = _.sortBy(nextProps.data, ["RecordId"]);
        let pages_count = 1;
        if (nextProps.count) {
            const t = nextProps.count / PAGE_SIZE;
            pages_count = parseInt(nextProps.count / PAGE_SIZE) + (t % 1 === 0 ? 0 : 1);
        }
        return { data: temp_dat, pages_count, records_count: nextProps.count };
    }

    setSearchFields(nextProps) {
        if (nextProps.config) {
            const { SearchFieldNames, DefaultSearchFieldName } = nextProps.config;
            if (SearchFieldNames && !SearchFieldNames.includes(DefaultSearchFieldName)) {
                SearchFieldNames.push(DefaultSearchFieldName);
            }
            const searchField = this.state.selectedSearchField ? this.state.selectedSearchField : DefaultSearchFieldName;
            const searchOptions = SearchFieldNames || [];
            if (this.state.searchFields !== searchOptions) {
                this.setState({
                    searchFields: searchOptions,
                    selectedSearchField: searchField
                });
            }
        }
    }

    setTableFilters(table_filters) {
        const tableFilters = [];
        Object.keys(table_filters).forEach((filter_key) => {
            const new_filter = {
                operator: "=",
                value: table_filters[filter_key],
                selectedField: filter_key,
                secondValue: "",
                tableFilter: true
            };
            tableFilters.push(new_filter);
        });
        this.setState({ show_table: true, table_filters: tableFilters });
        const sorting_data = this.state.column ? { column: this.state.column, direction: this.state.direction } : null;
        this.props.getData(this.state.filters, tableFilters, sorting_data, this.props.collectionName, this.state.page_number, PAGE_SIZE);
    }

    setSorting(column, direction) {
        this.setState({ column, direction, page_number: 1 }, () => {
            this.props.getData(this.state.filters, this.state.table_filters, { column, direction }, this.props.collectionName, this.state.page_number, PAGE_SIZE);
        });
    }

    searchItem(filters) {
        if (filters[0]) {
            // const searchValue = this.state.query_operator==='<x<' ? [this.state.searchValue,this.state.secondSearchValue] : this.state.searchValue;
            this.props.getData(filters, [], false, this.props.collectionName, this.state.page_number, PAGE_SIZE);
            this.setState({ loading: true, filters, page_number: 1 });
        }
    }

    getName(field) {
        const fields = field.split(".");
        return fields.length > 1 ? fields[1] : field;
    }

    saveData(recordId, product_data, audit_info, audit_data) {
        this.props.saveData({
            recordId,
            product_data,
            audit_info,
            audit_data,
            firmId: this.state.firmID,
            collectionName: this.props.collectionName
        });
    }

    addField() {
        if (this.state.fieldToAdd) {
            let fields = Array.from(this.props.fields);
            if (this.state.fieldToAdd === "RecordId") {
                fields = ["RecordId"].concat(fields);
            } else fields.push(this.state.fieldToAdd);
            this.props.addSearchField(fields);
            this.setState({ fields, fieldToAdd: "" });
            this.updateUrl(fields);
        }
    }

    updateUrl(fields) {
        if (window.location.search.includes("?config=")) {
            const ar = window.location.search.split("&");
            const i = ar.findIndex((f) => f.startsWith("fields="));
            if (i > 0) {
                ar[i] = `fields=${fields.map((f) => encodeURIComponent(f)).join(",")}`;
            } else ar.push(`fields=${fields.map((f) => encodeURIComponent(f)).join(",")}`);
            window.history.pushState(null, document.title, window.location.href.split("?")[0] + ar.join("&"));
        }
    }

    getField(key, fields, add_options) {
        return (field) => {
            const text = field;
            field = `${key}.${field}`;
            if (!fields.includes(field)) {
                add_options.push({ text, value: field });
            }
            return field;
        };
    }

    render() {
        const { data, selectedSearchField, searchFields, searchValue, secondSearchValue } = this.state;
        let { fields } = this.props;
        if (!fields.length && this.props.config) fields = this.props.config.DefaultFieldsToDisplayInSearchResultView;
        const revisionDiv = (
            <div style={{ position: "sticky", top: "100%", fontSize: "smaller" }}>
                revision:
                {this.props.revision}
            </div>
        );
        let add_options = [];
        if (this.state.show_table && this.props.data.length > 0) {
            if (this.props.data[0]) {
                for (const key of ["CurrentState", "AuditState"]) {
                    Object.keys(this.props.data[0][key] || []).map(this.getField(key, fields, add_options));
                }
            }
            if (this.props.user.role !== "external") {
                add_options = add_options.filter((e) => e.text !== "CopyOfRecordId" && e.text !== "IsDuplicate");
                add_options.push({ text: "CopyOfRecordId", value: "CurrentState.CopyOfRecordId" });
                add_options.push({ text: "IsDuplicate", value: "CurrentState.IsDuplicate" });
                if (!fields.includes("RecordId")) {
                    add_options.push({ text: "RecordId", value: "RecordId" });
                }
            }
        }

        return (
            <>
                <div className='container'>
                    <div style={{ display: "inline-block", float: "left" }}>
                        <ConfigSelector
                            updateConfig={(config) => this.updateConfig(config)}
                            config={this.props.config}
                            configs={this.props.configs}
                            no_configs_found={this.props.no_configs_found}
                            collectionName={this.props.collectionName}
                            getDataByFirmID={this.props.getDataByFirmID}
                            getConfigs={this.props.getConfigs}
                        />
                    </div>
                    {this.state.config_name && this.props.config ? (
                        <>
                            <span style={{ display: "inline-block", marginBottom: "10px" }}>
                                <SearchFilterList
                                    searchValue={searchValue}
                                    secondSearchValue={secondSearchValue}
                                    selectedSearchField={selectedSearchField}
                                    searchItem={this.searchItem}
                                    config={this.props.config}
                                    searchFields={searchFields.filter((f) => f !== "")}
                                    config_name={this.state.config_name}
                                />
                            </span>
                            {this.props.config.global_automatic_updates && this.props.config.global_automatic_updates.length > 0 && (
                                <GlobalUpdateButton collectionName={this.props.collectionName} recordId={-1} update_all audit_info={{ UserName: this.props.user.email }} />
                            )}
                            {this.state.show_table && (
                                <AddFieldSelector
                                    data={data}
                                    addField={this.addField}
                                    addState={(data) => {
                                        this.setState(data);
                                    }}
                                    add_options={add_options}
                                />
                            )}
                            <div className='clearfix'> </div>

                            {(data.length > 0 || this.state.table_filters.length > 0) && this.state.show_table ? (
                                <>
                                    <SearchTable
                                        config={this.props.config}
                                        getConfig={() => {
                                            return this.props.getConfig(this.state.config_name);
                                        }}
                                        data={this.state.data}
                                        fields={this.props.fields}
                                        firmID={this.state.firmID}
                                        collectionName={this.props.collectionName}
                                        addSearchField={this.props.addSearchField}
                                        pages_count={this.state.pages_count}
                                        filters={this.state.filters}
                                        setTableFilters={(table_filters) => this.setTableFilters(table_filters)}
                                        setSorting={this.setSorting}
                                        handlePageClick={this.handlePageClick}
                                        page_number={this.state.page_number}
                                        records_count={this.state.records_count}
                                        updateUrl={this.updateUrl}
                                    />
                                </>
                            ) : (
                                <div style={{ margin: "30px" }}>
                                    <h2>No matched data found ...</h2>
                                </div>
                            )}
                            {this.props.config.add_new_record && this.props.config.add_new_record.on && (
                                <a href={`/detail/${this.props.collectionName}/new/0`} target='_blank' rel='noreferrer'>
                                    <Button data-qa='add-new-record'>Add new record</Button>
                                </a>
                            )}
                        </>
                    ) : null}
                </div>
                {revisionDiv}
            </>
        );
    }
}

const mapStateToProps = (state) => ({
    isAuthenticated: state.authReducer.isAuthenticated,
    user: state.authReducer.user,
    data: state.dataReducer.data,
    count: state.dataReducer.count,
    fields: state.dataReducer.fields,
    config: state.dataReducer.config,
    revision: state.dataReducer.revision,
    collectionName: state.dataReducer.collectionName,
    dataChanged: state.dataReducer.dataChanged,
    configs: state.dataReducer.configs,
    no_configs_found: state.dataReducer.no_configs_found
});

const mapDispatchToProps = (dispatch) => ({
    getData: (filters, tableFilters, sorting_data, collectionName, page_number, page_size) =>
        dispatch(getDataByFirmID(filters, tableFilters, sorting_data, collectionName, page_number, page_size)),
    addSearchField: (fields) => dispatch(addSearchField(fields)),
    getConfig: (config = "") => dispatch(getConfig(config)),
    getConfigs: () => dispatch(getConfigs()),
    addRecord: (fields, collectionName, UserName) => dispatch(addRecord(fields, collectionName, UserName))
});

export default connect(mapStateToProps, mapDispatchToProps)(Home);
