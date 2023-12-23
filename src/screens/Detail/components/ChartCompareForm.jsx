import React from "react";
import { Tab } from "semantic-ui-react";
import { getDataByFirmID, getConfig, addSearchField, getConfigs, addRecord } from "../../../actions";
import { connect } from "react-redux";
import _ from "lodash";
import SearchFilterList from "../../Dashboard/SearchFilterList";
import AddFieldSelector from "../../Dashboard/AddFieldSelector";
import MiniSearchTable from "./MiniSearchTable";
const PAGE_SIZE = 20;

class ChartCompareForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            search_values: {},
            show_table: false,
            selectedSearchField: "",
            searchValue: "",
            secondSearchValue: "",
            query_operator: "=",
            searchFields: [],
            selectedRecords: [],
            page_number: 1,
            pages_count: 0,
            column: null,
            table_filters: [],
            direction: null,
            filters: []
        };

        this.searchItem = this.searchItem.bind(this);
        this.addSelectedRecord = this.addSelectedRecord.bind(this);
        this.removeSelectedRecord = this.removeSelectedRecord.bind(this);
        this.setTableFilters = this.setTableFilters.bind(this);

        this.addField = this.addField.bind(this);
        this.setSorting = this.setSorting.bind(this);
    }

    componentDidMount() {
        //this.props.getConfig();
        this.setSearchFields(this.props);
        if (this.props.config) {
            const charts_info = this.props.config.Charts;
            const current_state = this.props.record_data["CurrentState"];
            const filters = charts_info.DefaultSearchFieldsOnMiniSearchResultsScreen
                ? charts_info.DefaultSearchFieldsOnMiniSearchResultsScreen.map((field) => {
                      if (field["field"]) {
                          if (field["operator"] === "equals") field["operator"] = "=";
                          if (field["operator"] === "less") field["operator"] = "<";
                          if (field["operator"] === "greater") field["operator"] = ">";
                          if (field["operator"] === "between") field["operator"] = "<x<";
                          field["selectedField"] = field["field"];
                          field["secondValue"] = field["secondValue"] !== undefined ? field["secondValue"] : "";
                          let value = field["field"].indexOf(".") > 0 ? current_state[field["field"].split(".")[1]] || "" : this.props.record_data[field["field"]] || "";

                          if (field["value"] === "this") {
                              field["value"] = value;
                          }
                          if (field["secondValue"] === "this") {
                              field["secondValue"] = value;
                          }
                          var getDate = (d) => {
                              return d.toISOString().slice(0, 10);
                          };
                          let new_value = null;
                          let new_second_value = null;
                          if (typeof field["value"] === "string" && field["value"].indexOf("this") >= 0) {
                              try {
                                  var t = new Date(value.toString());
                                  new_value = eval(field["value"].replace(/this/g, "t"));
                                  if (typeof new_value === "number" && new_value.toString().length === 13) new_value = new Date(new_value).toISOString();
                              } catch (e) {
                                  new_value = null;
                              }
                          }
                          if (field["secondValue"] && typeof field["secondValue"] === "string" && field["value"].indexOf("this") >= 0) {
                              try {
                                  var t = new Date(value.toString());
                                  new_second_value = eval(field["secondValue"].replace(/this/g, "t"));
                                  if (typeof new_second_value === "number" && new_second_value.toString().length === 13)
                                      new_second_value = new Date(new_second_value).toISOString();
                              } catch (e) {
                                  new_second_value = null;
                              }
                          }

                          if (new_value) field["value"] = new_value;
                          if (new_second_value) field["secondValue"] = new_second_value;

                          if (field["field"] === "AuditState.ConfidenceScore" && this.props.config.ConfidenceScores) {
                              if (typeof field["value"] === "string") {
                                  const key = Object.keys(this.props.config.ConfidenceScores.ConfidenceScoreOptions).find((k) => k.toLowerCase() === field["value"].toLowerCase());
                                  field["value"] = this.props.config.ConfidenceScores.ConfidenceScoreOptions[key];
                              }
                          }
                          if (field["value"] === "this month" || field["value"] === "previous month") {
                              var d = new Date();
                              if (field["value"] === "this month") d.setMonth(d.getMonth() + 1);
                              d.setDate(0);
                              const end = d.toISOString().substring(0, 10);
                              d.setDate(1);
                              const start = d.toISOString().substring(0, 10);
                              field["value"] = start;
                              field["secondValue"] = end;
                              field["operator"] = "<x<";
                          }
                          return field;
                      }
                      const value = field.indexOf(".") > 0 ? current_state[field.split(".")[1]] || "" : this.props.record_data[field] || "";
                      return { operator: "=", secondValue: "", selectedField: field, value: value };
                  })
                : null;
            this.setState({ filters: filters });
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.config && this.props.config.SearchFieldNames && !prevState.searchFields.length > 0) {
        }
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        var temp_dat = _.sortBy(nextProps.data, ["RecordId"]);
        const pages_count = nextProps.count ? parseInt(nextProps.count / PAGE_SIZE) + 1 : 1;
        return { data: temp_dat.filter((t) => t["CurrentState"][nextProps.field_key] && t["RecordId"] !== nextProps.recordId), pages_count: pages_count };
    }

    setSearchFields(nextProps) {
        if (nextProps.config) {
            let { SearchFieldNames, DefaultSearchFieldName } = nextProps.config;
            const charts_info = this.props.config.Charts;
            const searchField = this.state.selectedSearchField ? this.state.selectedSearchField : DefaultSearchFieldName;
            const searchOptions = charts_info.MiniSearchResultsScreenSearchFieldNames ? charts_info.MiniSearchResultsScreenSearchFieldNames : [];
            this.setState({
                searchFields: searchOptions,
                selectedSearchField: searchField
            });
        }
    }

    addField() {
        if (this.state.fieldToAdd) {
            let fields = Array.from(this.props.fields);
            fields.push(this.state.fieldToAdd);
            this.props.addSearchField(fields);
            this.setState({ fields: fields, fieldToAdd: "" });
        }
    }

    getField(key, fields, add_options) {
        return (field) => {
            const text = field;
            field = key + "." + field;
            if (!fields.includes(field)) {
                add_options.push({ text: text, value: field });
            }
            return field;
        };
    }

    setSorting(column, direction) {
        this.setState({ column: column, direction: direction, page_number: 1 }, () => {
            this.props.getData(this.state.filters, [], { column: column, direction: direction }, this.props.collectionName, this.state.page_number, PAGE_SIZE);
        });
    }

    searchItem(filters) {
        if (filters[0]) {
            //console.log(filters);
            //const searchValue = this.state.query_operator==='<x<' ? [this.state.searchValue,this.state.secondSearchValue] : this.state.searchValue;
            this.props.getData(filters, [], null, this.props.collectionName, 1, PAGE_SIZE);
            this.setState({ show_table: true });
        }
    }

    getName(field) {
        const fields = field.split(".");
        return fields.length > 1 ? fields[1] : field;
    }

    addSelectedRecord(record) {
        let selectedRecords = this.state.selectedRecords;
        if (!selectedRecords.includes(record)) {
            selectedRecords.push(record);
            this.setState({ selectedRecords: selectedRecords });
            this.props.setSelectedRecords(selectedRecords);
        }
    }

    removeSelectedRecord(recordId) {
        const selectedRecords = this.state.selectedRecords.filter((t) => t["RecordId"] !== recordId);
        this.setState({ selectedRecords: selectedRecords });
        this.props.setSelectedRecords(selectedRecords);
    }

    getSelectedRecordLabel(record, label) {
        if (label) {
            if (label["Formatting"] && label["Fields"]) {
                let s = label["Formatting"];
                try {
                    label["Fields"].forEach((field) => {
                        let value = record["CurrentState"][field];
                        if (!value) value = "";
                        s = s.replace(field, "'" + value + "'");
                    });
                    s = eval(s);
                } catch (e) {
                    s = record["RecordId"];
                }
                return s;
            }
            if (record[label]) {
                return record[label];
            }
            if (record["CurrentState"][label]) return record["CurrentState"][label];
        }
        return record["RecordId"];
    }

    setTableFilters(table_filters) {
        let tableFilters = [];
        Object.keys(table_filters).forEach((filter_key) => {
            const new_filter = { operator: "=", value: table_filters[filter_key], selectedField: filter_key, secondValue: "", tableFilter: true };
            tableFilters.push(new_filter);
        });
        this.setState({ table_filters: tableFilters, show_table: tableFilters.length > 0 });
        this.props.getData(tableFilters, [], { column: this.state.column, direction: this.state.direction }, this.props.collectionName, this.state.page_number, PAGE_SIZE);
    }

    render() {
        const { data, selectedSearchField, searchFields, searchValue, secondSearchValue } = this.state;
        var fields = this.props.fields;

        let add_options = [];
        if (this.props.record_data) {
            for (let key of ["CurrentState", "AuditState"]) {
                Object.keys(this.props.record_data[key] || []).map(this.getField(key, fields, add_options));
            }
        }
        add_options = add_options.filter((e) => e.text !== "CopyOfRecordId" && e.text !== "IsDuplicate");
        add_options.push({ text: "CopyOfRecordId", value: "CurrentState.CopyOfRecordId" });
        add_options.push({ text: "IsDuplicate", value: "CurrentState.IsDuplicate" });
        const charts_info = this.props.config.Charts;
        const table_fields = charts_info.DefaultFieldsToDisplayInMiniSearchResultsScreen
            ? charts_info.DefaultFieldsToDisplayInMiniSearchResultsScreen
            : this.props.data && this.props.data.length > 0
            ? Object.keys(this.props.data[0]["CurrentState"]).map((t) => "CurrentState." + t)
            : null;
        const current_state = this.props.record_data["CurrentState"];

        return (
            <React.Fragment>
                {this.state.selectedRecords.length > 0 && (
                    <span className='mini_search_selected_record_box'>
                        <div key={"current_selected_compared"} style={{ backgroundColor: "#000000", color: "white" }} className='mini_search_selected_record'>
                            Current Data
                        </div>
                        {this.state.selectedRecords.map((record, index) => {
                            return (
                                <div
                                    key={record["RecordId"]}
                                    style={{ backgroundColor: this.props.colors[index % this.props.colors.length] }}
                                    className='mini_search_selected_record'
                                >
                                    {this.getSelectedRecordLabel(record, this.props.config.Charts["LegendLabelField"])}
                                    <span className='selected_record_mini_remove' onClick={() => this.removeSelectedRecord(record["RecordId"])}>
                                        X
                                    </span>
                                </div>
                            );
                        })}
                    </span>
                )}
                <div style={{ clear: "both" }}></div>
                <div className='chart_second_part'>
                    <div className='chart_compare_form'>
                        <span className='filters'>
                            <SearchFilterList
                                searchValue={searchValue}
                                secondSearchValue={secondSearchValue}
                                selectedSearchField={selectedSearchField}
                                searchItem={this.searchItem}
                                config={this.props.config}
                                searchFields={searchFields}
                                filters={this.state.filters}
                                isMiniSearch={true}
                            />
                        </span>
                        <div className='clearfix'> </div>

                        {data.length > 0 || this.state.show_table ? (
                            <div style={{ position: "relative" }}>
                                <AddFieldSelector
                                    data={data}
                                    addField={this.addField}
                                    addState={(data) => {
                                        this.setState(data);
                                    }}
                                    add_options={add_options}
                                />
                                <span style={{ display: "inline-block", maxWidth: "100%" }}>
                                    <MiniSearchTable
                                        config={this.props.config}
                                        table_fields={table_fields}
                                        data={this.state.data}
                                        fields={this.props.fields}
                                        firmID={this.state.firmID}
                                        collectionName={this.props.collectionName}
                                        addSearchField={this.props.addSearchField}
                                        selectedRecords={this.state.selectedRecords.map((r) => r["RecordId"])}
                                        setTableFilters={(table_filters) => this.setTableFilters(table_filters)}
                                        setSorting={this.setSorting}
                                        addRecord={this.addSelectedRecord}
                                    />
                                </span>
                            </div>
                        ) : (
                            <div style={{ margin: "30px" }}>
                                <h2>No matched data found ...</h2>
                            </div>
                        )}
                    </div>
                </div>
            </React.Fragment>
        );
    }
}
const mapStateToProps = (state) => ({
    isAuthenticated: state.authReducer.isAuthenticated,
    user: state.authReducer.user,
    data: state.dataReducer.chart_data,
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
        dispatch(getDataByFirmID(filters, tableFilters, sorting_data, collectionName, page_number, page_size, true)),
    addSearchField: (fields) => dispatch(addSearchField(fields))
});

export default connect(mapStateToProps, mapDispatchToProps)(ChartCompareForm);
