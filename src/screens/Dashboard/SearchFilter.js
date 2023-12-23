import React from "react";
import { Select, Button, Input, Dropdown } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import "./index.scss";

export const SearchFilter = function (props) {
    const getName = (field) => {
        if (!field) return null;
        const fields = field.split(".");
        return fields.length > 1 ? fields[1] : field;
    };

    const getConfidenceOptions = () => {
        if (!props.config) return null;
        const conf_options = props.config.ConfidenceScores;
        if (conf_options && conf_options.ConfidenceScoreOptions) {
            return Object.keys(conf_options.ConfidenceScoreOptions).map((key) => ({ text: key, value: conf_options.ConfidenceScoreOptions[key] }));
        }
        return null;
    };

    const { searchFields } = props;
    const isLastMiniSearch = props.isLast && props.isMiniSearch;
    let operators = [
        { text: "Equal (==)", value: "=" },
        { text: "Not Equal (!=)", value: "!=" },
        { text: "Less than (<)", value: "<" },
        { text: "Greater than (>)", value: ">" }
    ];
    if (!props.isObjectFilter)
        operators = operators.concat([
            { text: "Strict search", value: "===" },
            { text: "Between (<x<)", value: "<x<" },
            { text: "In", value: "in" },
            { text: "Not In", value: "nin" }
        ]);
    const conf_options = props.selectedSearchField === "AuditState.ConfidenceScore" ? getConfidenceOptions() : null;
    return (
        <>
            <span className={props.index > 0 ? "search_filter" : ""} data-qa={props.selectedSearchField}>
                {props.index === 0 && props.isObjectFilter && (
                    <Button data-qa='filter-remove' className='red searchBtnNested' onClick={(i) => props.reset()}>
                        X
                    </Button>
                )}
                {props.index > 0 && (
                    <Button data-qa='filter-remove' className='red searchBtn' onClick={(i) => props.removeFilter(props.index)}>
                        X
                    </Button>
                )}
                <Dropdown
                    selection
                    className='search-with-btn'
                    placeholder='Select field'
                    onChange={(e, val) => props.setValue({ selectedField: val.value, value: "" })}
                    value={props.selectedSearchField}
                    data-qa='select-field'
                    search
                    options={searchFields ? searchFields.map((field, i) => ({ key: 1 + i, value: field, text: getName(field) })) : []}
                />
                <Select
                    className='search-with-btn'
                    placeholder='Equal (==)'
                    onChange={(e, val) => props.setValue({ operator: val.value })}
                    value={props.operator}
                    search
                    options={operators.map((field, i) => ({ key: 1 + i, value: field.value, text: field.text }))}
                    data-qa='set-operation'
                />
                <div className='serach-input' data-qa='set-data'>
                    <Input className='search_filter_input' type='text' placeholder={props.selectedSearchField}>
                        {props.operator !== "<x<" && props.operator && <span className='between_sign_text'> {props.operator} </span>}
                        {conf_options ? (
                            <Dropdown
                                data-qa='field-val-dropdown'
                                multiple
                                options={conf_options}
                                selection
                                value={
                                    Array.isArray(props.searchValue)
                                        ? props.searchValue
                                        : (props.searchValue || "")
                                              .toString()
                                              .split(",")
                                              .filter((t) => t != "")
                                              .map((t) => parseInt(t))
                                }
                                onChange={(e, data) => {
                                    props.setValue({ value: data.value });
                                }}
                            />
                        ) : (
                            <input
                                data-qa='field-value'
                                value={props.searchValue}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        props.searchItem();
                                    }
                                }}
                                onChange={(e) => props.setValue({ value: e.target.value })}
                            />
                        )}
                        {props.operator === "<x<" && (
                            <>
                                <span className='between_sign_text'> &lt;x&lt; </span>
                                <input
                                    data-qa='field-value'
                                    placeholder={props.selectedSearchField}
                                    value={props.secondSearchValue}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            props.searchItem();
                                        }
                                    }}
                                    onChange={(e) => props.setValue({ secondValue: e.target.value })}
                                />
                            </>
                        )}
                        {props.showAddButton && props.isLast && (
                            <Button data-qa='add-search-field' className='blue searchBtn' onClick={props.addFilter}>
                                +
                            </Button>
                        )}
                        {props.isLast && (
                            <Button data-qa='search-btn' className='blue searchBtn' onClick={props.searchItem}>
                                Search
                            </Button>
                        )}
                    </Input>
                </div>
            </span>
        </>
    );
};

export default SearchFilter;
