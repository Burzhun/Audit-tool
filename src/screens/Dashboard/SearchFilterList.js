import React from "react";

import "semantic-ui-css/semantic.min.css";
import "./index.scss";
import SearchFilter from "./SearchFilter";

class SearchFilterList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            filters: [],
            init: true
        };
        this.searchItem = this.searchItem.bind(this);
        this.addFilter = this.addFilter.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.setValue = this.setValue.bind(this);
    }

    componentDidMount() {
        if (this.props.isObjectFilter) {
            this.setState({
                filters: [
                    {
                        value: "",
                        secondValue: "",
                        selectedField: this.props.selectedSearchField,
                        operator: "="
                    }
                ]
            });
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const new_config_name = this.props.config ? this.props.config.CollectionRelevantFor : "";
        const old_config_name = prevProps.config ? prevProps.config.CollectionRelevantFor : "";
        if (new_config_name !== old_config_name || this.props.selectedSearchField !== prevProps.selectedSearchField) {
            let url_search = window.location.search;
            let use_config = false;
            if (!this.state.init || url_search === "") {
                if (this.props.config && this.props.config.DefaultUrl) {
                    if (this.props.config.DefaultUrl.on && this.props.config.DefaultUrl.url) {
                        url_search = `?config=${new_config_name}&` + this.props.config.DefaultUrl.url;
                        use_config = true;
                    }
                }
            }
            const url_contains_config = url_search.includes(`?config=${new_config_name}`);
            // if(!url_contains_config)
            if (this.state.init || use_config) {
                if (url_contains_config) {
                    if (use_config && this.state.init) this.setState({ init: false });
                    const filters = decodeURI(url_search)
                        .replace("?", "")
                        .split("&")
                        .map((s) => {
                            let delimeter = ["n^", "!=", "===", "=", "<", ">", "^"].find((k) => s.includes(k));
                            const [key, value] = delimeter && s.split(delimeter).length === 2 ? s.split(delimeter) : ["", ""];
                            if (delimeter === "^") {
                                delimeter = "in";
                            }
                            if (delimeter === "n^") {
                                delimeter = "nin";
                            }
                            if (!this.props.searchFields.includes(decodeURIComponent(key))) return null;

                            if (value.includes("<x<")) {
                                return {
                                    value: decodeURIComponent(value.split("<x<")[0]),
                                    secondValue: decodeURIComponent(value.split("<x<")[1]),
                                    selectedField: decodeURIComponent(key),
                                    operator: "<x<"
                                };
                            }
                            return {
                                value: decodeURIComponent(value),
                                secondValue: "",
                                selectedField: decodeURIComponent(key),
                                operator: delimeter
                            };
                        })
                        .filter((f) => f);
                    if (filters.length) {
                        this.setState({ filters }, () => {
                            this.searchItem();
                        });
                    } else {
                        this.setState({
                            filters: [
                                {
                                    value: "",
                                    secondValue: "",
                                    selectedField: this.props.selectedSearchField,
                                    operator: "="
                                }
                            ]
                        });
                    }
                } else {
                    this.setState({
                        init: false,
                        filters:
                            this.props.filters && this.props.filters.length > 0
                                ? this.props.filters
                                : [
                                      {
                                          value: "",
                                          secondValue: "",
                                          selectedField: this.props.selectedSearchField,
                                          operator: "="
                                      }
                                  ]
                    });
                }
            } else {
                this.setState({
                    filters: [
                        {
                            value: "",
                            secondValue: "",
                            selectedField: this.props.selectedSearchField,
                            operator: "="
                        }
                    ]
                });
            }
        }
        if (!this.props.isMiniSearch && !this.state.init && this.state.filters && this.state.filters.length > 0) {
            let new_url = `?config=${this.props.config_name}&${this.state.filters
                .map((filter) => {
                    if (filter.secondValue) {
                        return `${encodeURIComponent(filter.selectedField)}=${encodeURIComponent(filter.value)}<x<${encodeURIComponent(filter.secondValue)}`;
                    }
                    return encodeURIComponent(filter.selectedField) + (filter.operator || "").replace("in", "^") + encodeURIComponent(filter.value);
                })
                .join("&")}`;
            const old_url = window.location.search;
            if (window.location.search.includes("&fields=")) {
                new_url += `&${window.location.search.split("&").find((f) => f.startsWith("fields="))}`;
            }
            if (new_url !== old_url) {
                window.history.pushState(null, document.title, window.location.href.split("?")[0] + new_url);
            }
        }
    }

    searchItem() {
        this.props.searchItem(this.state.filters);
    }

    addFilter() {
        const { filters } = this.state;
        filters.push({
            value: "",
            secondValue: "",
            operator: "=",
            selectedField: this.props.selectedSearchField
        });
        this.setState({ filters, init: false });
    }

    removeFilter(i) {
        const { filters } = this.state;
        filters.splice(i, 1);
        this.setState({ filters, init: false });
        this.props.searchItem(this.state.filters);
    }

    setValue(data, index) {
        const { filters } = this.state;
        const filter = filters[index];
        Object.assign(filter, data);
        filters[index] = filter;
        this.setState({ filters, init: false });
    }

    render() {
        const last_index = this.state.filters.length - 1;
        const maxNumber = this.props.maxNumber || 10;
        return this.state.filters.map((filter, index) => (
            <SearchFilter
                searchValue={filter.value}
                key={index}
                index={index}
                secondSearchValue={filter.secondValue}
                selectedSearchField={filter.selectedField}
                searchItem={this.searchItem}
                searchFields={this.props.searchFields}
                showAddButton={this.state.filters.length < maxNumber}
                operator={filter.operator}
                config={this.props.config}
                addState={(data) => {
                    this.setState(data);
                }}
                reset={() => {
                    this.setState({
                        filters: [
                            {
                                value: "",
                                secondValue: "",
                                selectedField: this.props.selectedSearchField,
                                operator: "="
                            }
                        ]
                    });
                    this.props.searchItem([]);
                }}
                addFilter={this.addFilter}
                removeFilter={this.removeFilter}
                isLast={index === last_index}
                isObjectFilter={this.props.isObjectFilter}
                isMiniSearch={this.props.isMiniSearch}
                setValue={(data) => this.setValue(data, index)}
            />
        ));
    }
}

export default SearchFilterList;
