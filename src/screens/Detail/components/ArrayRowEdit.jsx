import React from "react";
import {Button, Input, Popup, Table} from "semantic-ui-react";
import UpdateCell from "./UpdateCell";
import CommentCell from "./CommentCell";
import dash from "../../../images/dash.png";
import checkmark from "../../../images/checkmark.svg";
import xdelete from "../../../images/x-delete.svg";
import SortableMultiSelect from "./SortableMultiSelect";

const valid_option_list = [
    {
        label: <img className="valid_selector_label_image" alt="" src={dash}/>,
        key: 0,
        value: 0,
    },
    {
        label: <img className="valid_selector_label_image" alt="" src={checkmark}/>,
        key: 1,
        value: 1,
    },
    {
        label: <img className="invalid_selector_label_image" alt="" src={xdelete}/>,
        key: 2,
        value: 2,
    },
];

function convertTime(utcTime) {
    let chunked = utcTime.replace("T", " ");
    chunked = chunked.split(".");
    return chunked[0];
}

let show_audit_selector = true;
export default class ArrayRowEdit extends React.Component {
    constructor(props) {
        super(props);
        this.state = {fieldNames: [], disabled: {}, selected: {}, checked: {}, all_updated: {}};
        this.getInfoPopup = this.getInfoPopup.bind(this);
        this.setValidState = this.setValidState.bind(this);
        this.setNewValue = this.setNewValue.bind(this);
        this.defineDataType = this.defineDataType.bind(this);
        this.isDisabled = this.isDisabled.bind(this);
        this.getCommentValue = this.getCommentValue.bind(this);
        this.getValidImage = this.getValidImage.bind(this);
        this.setChecked = this.setChecked.bind(this);
        this.setArrayComment = this.setArrayComment.bind(this);
    }

    componentDidMount() {
        show_audit_selector = this.props.config.AuditDropdownVisible !== false;
        const fieldNames = Object.keys(this.props.data).filter((item) => item !== "_id");
        this.setState({fieldNames: fieldNames});
        if (this.props.selected_subfields[this.props.data["_id"]] && this.props.selected_subfields[this.props.data["_id"]][this.props.fieldName]) {
            this.setState({selected: this.props.selected_subfields[this.props.data["_id"]][this.props.fieldName]});
        }
        if (this.props.select_all_fields[this.props.data["_id"]]) {
            this.setState({checked: this.props.selected_subfields[this.props.data["_id"]]});
        }
        let all_updated = {};
        Object.keys(this.props.select_all_fields).forEach((id_key) => {
            const values = this.props.select_all_fields[id_key];
            if (id_key === this.props.data["_id"]) {
                Object.keys(values).forEach((field_key) => {
                    this.setChecked(true, field_key);
                });
                return;
            }
            Object.keys(values).forEach((field_key) => {
                all_updated[field_key] = true;
            });
        });
        this.setState({all_updated: all_updated});
    }

    defineDataType(field_name) {
        const validators = this.props.config["Validators"];
        let validator = [];
        if (validators) {
            validator = validators.filter((val) => val.name === field_name);
        }
        if (validator.length > 0) {
            let type = validator[0].type;
            if (type === "enumerate") {
                type = type + ": " + validator[0]["constraints"]["values"];
            }
            return type;
        }
        return "string";
    }

    setValidState(value, subfieldName, id) {
        const fieldName = this.props.element_key;
        let disabled = true;
        const apply_all = this.state.checked[subfieldName] === true;
        if (value === 2 /*&& this.state.editable*/) {
            disabled = false;
            //this.props.setNewValue(fieldName, '', false)
            this.props.setNewArrayValue(fieldName, id, subfieldName, "", false, apply_all);
            let selected = this.state.selected;
            selected[subfieldName] = true;
            this.setState({selected: selected});
        }
        if (value === 1) {
            this.props.setNewArrayValue(fieldName, id, subfieldName, "", true, apply_all && this.state.selected[subfieldName]);
            //this.props.setNewValue(fieldName, '', true)
        }

        this.setState({disabled: disabled, valid: value});
        this.props.setSelectedSubField(subfieldName, id);
        this.props.setValidity(this.props.element_key, id, subfieldName, value, this.state.selected[subfieldName]);

        if (value < 2) {
            let selected = this.state.selected;
            if (selected[subfieldName]) {
                delete selected[subfieldName];
                this.setChecked(false, subfieldName);
            }
            this.setState({selected: selected});
        }
    }

    getValidImage(valid) {
        let validImg = <img alt="" src={xdelete} width={"30px"}/>;
        if (valid) {
            validImg = <img alt="" src={checkmark} width={"30px"}/>;
        }
        return validImg;
    }

    setChecked(check, field) {
        let checked = this.state.checked;
        checked[field] = check;
        this.setState({checked: checked});
        const changedValues = this.props.changedValues[this.props.element_key];
        if (changedValues) {
            const changedId = changedValues[this.props.data["_id"]];
            if (changedId[field]) {
                if (check)
                    this.props.setNewArrayValue(this.props.element_key, null, field, changedId[field]["value"], changedId[field]["valid"], true, changedId[field]["comment"]);
                else this.props.unsetArrayValues(this.props.element_key, this.props.data["_id"], field, changedId[field]["value"]);
            }
        }
        this.props.setSelectedAllField(field, this.props.data["_id"], check);
    }

    getInfoPopup(audit_name, key) {
        const previousAudit = this.props.previousAudit;
        let audited = previousAudit[audit_name];
        if (!audited) {
            const key1 = this.props.complexField
                ? this.props.element_key.replace(".index", ".") + "." + this.props.data["_id"] + "." + key
                : this.props.fieldName + "." + this.props.data["_id"];
            if (previousAudit[key1]) audited = previousAudit[key1];
        }
        if (audited) {
            return (
                <Popup
                    content={
                        <div>
                            <p>Updated by: {audited.who}</p>
                            <p>Updated date: {audited.when}</p>
                            <p>Data change: {this.getValidImage(audited.valid)}</p>
                            {/*<p>Previous value: {(audited.old!==undefined ? audited.old : '').toString()}</p>*/}
                            <p>Previous value: {(audited.old === false ? "False" : audited.old || "").toString()}</p>
                            <p>Update comment: {audited.comment}</p>
                        </div>
                    }
                    on="click"
                    position={"top right"}
                    trigger={<Button data-qa="audit-info" content="Audit info"/>}
                />
            );
        }
    }

    setNewValue(fieldName, id, subfieldName, value, valid) {
        if (this.props.config.AuditDropdownVisible === false) {
            let selected = this.state.selected;
            selected[subfieldName] = true;
            this.setState({selected: selected});
        }
        const apply_all = this.state.checked[subfieldName] === true;
        this.props.setNewArrayValue(fieldName, id, subfieldName, value, valid, apply_all);
    }

    getCommentValue(id, subFieldName) {
        const fieldName = this.props.fieldName;
        return this.props.changedValues[fieldName] && this.props.changedValues[fieldName][id] && this.props.changedValues[fieldName][id][subFieldName]
            ? this.props.changedValues[fieldName][id][subFieldName]["comment"]
            : "";
    }

    isDisabled(id, subField) {
        if (!show_audit_selector) return false;
        const fieldName = this.props.element_key;
        return !(
            this.props.changedValues[fieldName] &&
            this.props.changedValues[fieldName][id] &&
            this.props.changedValues[fieldName][id][subField] &&
            !this.props.changedValues[fieldName][id][subField]["valid"]
        );
    }

    setArrayComment(fieldName, id, key, value) {
        const apply_all = this.state.checked[key] === true;
        this.props.setArrayComment(fieldName, id, key, value, apply_all);
    }

    prepareData(n, keep_array = false) {
        if (!keep_array && Array.isArray(n)) {
            return n.join(", ").replace(/\\\'/g, "'").replace(/\\\"/g, '"');
        }
        if (typeof n === "string") {
            n = n.replace(/\\\'/g, "'").replace(/\\\"/g, '"');
        }
        if (/^http/.test(n))
            return (
                <a
                    onClick={(e) => {
                        window.open(n, "_blank");
                    }}
                    href={n}
                    style={{color: "#014996"}}
                    target={"_blank"}
                >
                    {n}
                </a>
            );
        if (n === true) return "True";
        if (n === false) return "False";
        return n;
    }

    render() {
        const data_keys = this.props.fieldNames;
        const row_id = this.props.fieldName + this.props.data["_id"];
        return (
            <React.Fragment>
                <Table.Row id={row_id} className="array_row_top_border selected_array_row">
                    <Table.Cell className="array_row_view_header ">Field</Table.Cell>
                    {data_keys.map((field, index) => (
                        <Table.Cell onClick={this.props.hideView}
                                    style={{margin: "10px", cursor: "pointer"}}
                                    key={"array_row_view_header" + this.props.fieldName + field}>
                            {field}
                        </Table.Cell>
                    ))}
                </Table.Row>
                {!this.props.new_record && (
                    <React.Fragment>
                        <Table.Row id={row_id} className="selected_array_row" data-qa="current-data">
                            <Table.Cell className="array_row_view_header">Current Data</Table.Cell>
                            {data_keys.map((key) => (
                                <Table.Cell data-qa={key} style={{margin: "10px", cursor: "pointer"}} name={key}
                                            value="value"
                                            key={this.props.fieldName + "edit_view" + key}>
                                    {this.prepareData(this.props.data[key])}
                                </Table.Cell>
                            ))}
                        </Table.Row>
                        <Table.Row id={row_id} className="selected_array_row" data-test="edit_view">
                            <Table.Cell className="array_row_view_header" style={{minHeight: "45px"}}>
                                {show_audit_selector && (
                                    <span>
                                        Valid
                                        <br/>
                                        (Yes/No)
                                    </span>
                                )}
                            </Table.Cell>
                            {data_keys.map((key) =>
                                show_audit_selector ? (
                                    <Table.Cell
                                        data-qa={key}
                                        style={{
                                            margin: "10px",
                                            cursor: "pointer",
                                            position: "relative",
                                            overflow: "unset"
                                        }}
                                        key={this.props.fieldName + "edit_view" + key}
                                    >
                                        {!this.props.uneditable_fields[key] && (
                                            <React.Fragment>
                                                <SortableMultiSelect
                                                    options={valid_option_list}
                                                    className="array_row_valid_select"
                                                    menuPlacement={"bottom"}
                                                    name={key}
                                                    isMulti={false}
                                                    isDisabled={this.state.all_updated[key]}
                                                    value={valid_option_list.find(
                                                        (t) => t.value === (this.props.validity && this.props.validity[key] ? this.props.validity[key] : 0)
                                                    )}
                                                    onChange={(value, m) => {
                                                        this.setValidState(value.value, key, this.props.data["_id"]);
                                                    }}
                                                />
                                                <div style={{
                                                    fontSize: "15px",
                                                    marginTop: "10px",
                                                    display: this.state.selected[key] ? "block" : "none"
                                                }}>
                                                    <Input
                                                        checked={this.state.checked[key]}
                                                        id={this.props.data["_id"] + key}
                                                        disabled={!this.state.selected[key]}
                                                        onClick={(e) => {
                                                            this.setChecked(e.target.checked, key);
                                                        }}
                                                        type="checkbox"
                                                    />{" "}
                                                    <label htmlFor={this.props.data["_id"] + key}>Apply to all
                                                        records</label>
                                                </div>
                                            </React.Fragment>
                                        )}
                                    </Table.Cell>
                                ) : (
                                    <Table.Cell data-qa={key}
                                                key={this.props.fieldName + "edit_view" + key}>
                                        <div style={{
                                            fontSize: "15px",
                                            marginTop: "10px",
                                            display: this.state.selected[key] ? "block" : "block"
                                        }}>
                                            <Input
                                                checked={this.state.checked[key]}
                                                id={this.props.data["_id"] + key}
                                                disabled={!this.state.selected[key]}
                                                onClick={(e) => {
                                                    this.setChecked(e.target.checked, key);
                                                }}
                                                type="checkbox"
                                            />{" "}
                                            <label htmlFor={this.props.data["_id"] + key}>Apply to all records</label>
                                        </div>
                                    </Table.Cell>
                                )
                            )}
                        </Table.Row>
                    </React.Fragment>
                )}
                <Table.Row id={row_id} className="selected_array_row">
                    <Table.Cell className="array_row_view_header">New Data</Table.Cell>
                    {data_keys.map((key) => {
                        const item_id = this.props.data["_id"];
                        return (
                            <Table.Cell data-qa={key} data-test="new-value"
                                        style={{margin: "10px", cursor: "pointer", overflow: "unset"}}
                                        key={this.props.fieldName + "edit_view" + key}>
                                <UpdateCell
                                    changedValues={this.props.changedValues}
                                    valid={this.props.validity && this.props.validity[key] ? this.props.validity[key] : 0}
                                    subFieldName={key}
                                    isArrayCell={true}
                                    upward={this.props.new_record}
                                    field_id={item_id}
                                    fieldName={this.props.fieldName}
                                    disabled={
                                        (!this.props.new_record && this.isDisabled(item_id, key)) || this.props.uneditable_fields[key] || this.state.all_updated[key] || false
                                    }
                                    config={this.props.config}
                                    errors={this.props.errors}
                                    resize={(field, width) => {
                                        this.props.resize(field, width);
                                    }}
                                    rowData={{name: this.props.element_key}}
                                    error_key={this.props.fieldName + "." + key}
                                    //field_name={this.props.field_list[this.props.index].text}
                                    convertTime={convertTime}
                                    currentData={this.props.data[key]}
                                    dataType={this.defineDataType(this.props.fieldName + "." + key)}
                                    setNewValue={(fieldName, value) => this.setNewValue(fieldName, item_id, key, value, false)}
                                />
                            </Table.Cell>
                        );
                    })}
                </Table.Row>
                <Table.Row id={row_id} className="selected_array_row">
                    <Table.Cell className="array_row_view_header">Comment</Table.Cell>
                    {data_keys.map((key) => (
                        <CommentCell
                            data-qa={key}
                            changedValues={this.props.changedValues}
                            disabled={this.isDisabled(this.props.data["_id"], key) || this.state.all_updated[key] || false}
                            key={this.props.fieldName + "edit_comment" + key}
                            setComment={(fieldName, value) => this.setArrayComment(this.props.element_key, this.props.data["_id"], key, value)}
                            fieldName={key}
                            value={this.getCommentValue(this.props.data["_id"], key)}
                        />
                    ))}
                </Table.Row>
                {
                    <Table.Row id={row_id} className="selected_array_row">
                        <Table.Cell className="array_row_view_header"></Table.Cell>
                        {data_keys.map((key) => (
                            <Table.Cell data-qa={key} key={this.props.fieldName + "info_popup" + key} name={key}>
                                {this.getInfoPopup(this.props.fieldName + "." + this.props.data["_id"] + "." + key, key)}
                            </Table.Cell>
                        ))}
                    </Table.Row>
                }
                <Table.Row id={row_id} className="array_row_bottom_border selected_array_row">
                    <Table.Cell></Table.Cell>
                    {data_keys.map((key) => (
                        <Table.Cell data-qa={key} key={key + "bottom_order"}></Table.Cell>
                    ))}
                </Table.Row>
            </React.Fragment>
        );
    }
}
