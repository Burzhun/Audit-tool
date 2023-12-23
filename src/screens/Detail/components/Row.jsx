import React from "react";
import PropTypes from "prop-types";
import { Table, Select, Popup, Button, Checkbox } from "semantic-ui-react";
import UpdateCell from "./UpdateCell";
import CurrentDataCell from "./CurrentDataCell";
import CommentCell from "./CommentCell";
import dash from "../../../images/dash.png";
import { Icon } from "semantic-ui-react";
import checkmark from "../../../images/checkmark.svg";
import xdelete from "../../../images/x-delete.svg";
import SortableMultiSelect from "./SortableMultiSelect";

const valid_option_list = [
    {
        label: <img className='valid_selector_label_image' alt='' src={dash} />,
        key: 0,
        value: 0
    },
    {
        label: <img className='valid_selector_label_image' alt='' src={checkmark} />,
        key: 1,
        value: 1
    },
    {
        label: <img className='invalid_selector_label_image' alt='' src={xdelete} />,
        key: 2,
        value: 2
    }
];

function convertTime(utcTime) {
    let chunked = utcTime.replace("T", " ");
    chunked = chunked.split(".");
    return chunked[0];
}

export default class TableRow extends React.Component {
    static propTypes = {
        rowData: PropTypes.object.isRequired,
        config: PropTypes.object.isRequired,
        previousAudit: PropTypes.object.isRequired,
        changedValues: PropTypes.object.isRequired,
        setNewValue: PropTypes.func.isRequired,
        setComment: PropTypes.func.isRequired,
        setValidity: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            valid: 0,
            size: { field: 150 },
            validator: null,
            dataType: "text",
            editable: !(this.props.config.UnEditableFields && this.props.config.UnEditableFields.includes(this.props.fieldName || this.props.rowData.name)),
            auditSelectorVisible: this.props.config.AuditDropdownVisible !== false
        };
        this.state["disabled"] = !(this.state.editable && !this.state.auditSelectorVisible);
        this.setValidState = this.setValidState.bind(this);
        this.defineDataType = this.defineDataType.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.previousAudit !== this.props.previousAudit) {
            this.setState({ valid: 0, disabled: !(this.state.editable && !this.state.auditSelectorVisible) });
        }

        if (prevProps.blockedFields !== this.props.blockedFields) {
            if (
                this.props.blockedFields[this.props.fieldName] &&
                this.props.blockedFields[this.props.fieldName].index[this.props.element_index] &&
                this.props.blockedFields[this.props.fieldName].index[this.props.element_index].values.length > 1 &&
                this.props.blockedFields[this.props.fieldName].index[this.props.element_index].blocked &&
                !this.props.rowData.value.includes(this.props.blockedFields[this.props.fieldName].value)
            ) {
                this.setState({ editable: false });
            } else {
                if (!(this.props.config.UnEditableFields && this.props.config.UnEditableFields.includes(this.props.fieldName || this.props.rowData.name)))
                    this.setState({ editable: true });
            }
        }

        if (prevProps.rowData !== this.props.rowData) {
            if (
                this.props.blockedFields[this.props.fieldName] &&
                this.props.blockedFields[this.props.fieldName].index[this.props.element_index] &&
                this.props.blockedFields[this.props.fieldName].index[this.props.element_index].values.length > 1 &&
                this.props.blockedFields[this.props.fieldName].index[this.props.element_index].blocked &&
                !this.props.rowData.value.includes(this.props.blockedFields[this.props.fieldName].value)
            ) {
                this.setState({ editable: false });
            } else {
                if (!(this.props.config.UnEditableFields && this.props.config.UnEditableFields.includes(this.props.fieldName || this.props.rowData.name)))
                    this.setState({ editable: true });
            }
            let valid = this.props.rowData.valid;
            //const fieldName = this.props.rowData.name;
            let disabled = true;
            if (valid === 2 && this.state.editable) {
                disabled = false;
            }
            if (this.state.valid && Object.keys(this.props.changedValues).length === 0) {
                valid = 0;
                disabled = true;
            }
            if (disabled && this.state.editable && !this.state.auditSelectorVisible) disabled = false;
            this.setState({ valid: valid, disabled: disabled });
        }
        if (this.props.changedValues[this.props.element_key] && !this.state.valid) {
            this.setValidState(this.props.changedValues[this.props.element_key].valid ? 1 : 2);
        }
    }

    componentDidMount() {
        this.defineDataType();
        if (!this.state.size) return;
        const field_length = this.props.rowData.name.length * 6 + 30;
        const size = this.state.size["field"] ? this.state.size["field"] : 150;
        if (field_length > size) this.props.setTableFieldSize("field", field_length);
    }

    getValidImage(valid) {
        let validImg = <img alt='' src={xdelete} width={"30px"} />;
        if (valid) {
            validImg = <img alt='' src={checkmark} width={"30px"} />;
        }
        return validImg;
    }

    getRowColoredClass(name) {
        if (!this.state.editable) return "disabledRow";
        if (this.props.previousAudit[name]) {
            return "coloredRow";
        }
        return "";
    }

    defineDataType() {
        const name = this.props.fieldName ? this.props.fieldName : this.props.rowData.name;
        const validators = this.props.config["Validators"];
        let validator = [];
        if (validators) {
            validator = validators.find((val) => val.name === name);
        }
        if (validator) {
            if (validator.isbool) {
                this.setState({ validator: validator, dataType: "bool" });
                return;
            }
            let type = validator.type;
            if (type === "enumerate") {
                type = type + ": " + validator["constraints"]["values"];
            }
            this.setState({ validator: validator, dataType: type });
            return type;
        } else {
            this.setState({
                validator: {
                    name: name,
                    type: "text",
                    constraints: {}
                },
                dataType: "text"
            });
        }
    }

    getInfoPopup() {
        const { name } = this.props.rowData;
        const previousAudit = this.props.previousAudit;
        const audited = previousAudit[this.props.element_key];
        if (audited) {
            return (
                <Popup
                    content={
                        <div data-qa='updated-field'>
                            <p>Updated by: {audited.who}</p>
                            <p>Updated date: {audited.when}</p>
                            <p>Data change: {this.getValidImage(audited.valid)}</p>
                            <p>Previous value: {Array.isArray(audited.old) ? audited.old.join(" ") : audited.old}</p>
                            <p>Update comment: {audited.comment}</p>
                        </div>
                    }
                    on='click'
                    position={"top right"}
                    trigger={<Button data-qa='audit-info' content='Audit info' />}
                />
            );
        }
    }

    setValidState(value) {
        const fieldName = this.props.rowData.name;
        let disabled = true;
        if (value == 1 || (value === 2 && this.state.editable)) {
            disabled = false;
            const fieldValue = this.props.rowData["value"] || "";
            if (!this.props.changedValues[fieldName] || value !== 2) {
                if (this.state.validator)
                    this.props.setNewValue(
                        fieldName,
                        this.state.validator.type.includes("enumerate") || this.state.validator.type.includes("_array") ? fieldValue : Array.isArray(fieldValue) ? [] : "",
                        value == 1
                    );
                else this.props.setNewValue(fieldName, Array.isArray(fieldValue) ? [] : "", value == 1);
            }
        }
        if (disabled && this.state.editable && !this.state.auditSelectorVisible) disabled = false;
        this.setState({ disabled: disabled, valid: value });
        this.props.setValidity(this.props.rowData, value);
    }

    render() {
        const name = this.props.fieldName ? this.props.fieldName : this.props.rowData.name;
        const sizes = this.props.sizes;
        const valid = this.state.valid;
        let is_auto_field = this.props.auto_field;
        if (this.props.config.updates_manual_overwrite_fields && this.props.config.updates_manual_overwrite_fields.includes(name)) is_auto_field = false;
        return (
            <div /*ref={this.props.ref_prop} {...this.props.drag_provided.draggableProps} {...this.props.drag_provided.dragHandleProps}*/>
                <Table striped fixed textAlign='center' className='detail_table toplevel_field_row'>
                    <Table.Body>
                        <Table.Row
                            key={name}
                            id={name}
                            className={this.getRowColoredClass(this.props.element_key || name)}
                            onDoubleClick={(e) => {
                                if (e.target.tagName === "TD") {
                                    this.props.removeField();
                                }
                            }}
                        >
                            <Table.Cell style={{ textAlign: "justify", width: sizes["field"] ? sizes["field"] + "px" : "150px" }} name='name'>
                                {name}
                            </Table.Cell>

                            <CurrentDataCell
                                rowData={this.props.rowData}
                                errors={this.props.errors}
                                width={sizes["current"] ? sizes["current"] + "px" : "150px"}
                                config={this.props.config}
                                changedValues={this.props.changedValues}
                                dataType={this.state.dataType}
                                convertTime={convertTime}
                            />

                            {!is_auto_field ? (
                                <React.Fragment>
                                    {this.state.auditSelectorVisible && (
                                        <Table.Cell
                                            className='valid_selector'
                                            style={{
                                                overflow: "visible",
                                                width: sizes["valid"] ? sizes["valid"] + "px" : "150px"
                                            }}
                                        >
                                            <SortableMultiSelect
                                                options={valid_option_list}
                                                className='valid_new_selector'
                                                name={this.props.subFieldName}
                                                menuPlacement={this.props.show_upward ? "top" : "bottom"}
                                                isMulti={false}
                                                isDisabled={!this.state.editable}
                                                value={valid_option_list.find((t) => t.value === valid)}
                                                onChange={(value, m) => {
                                                    if (value) this.setValidState(value.value);
                                                }}
                                            />
                                        </Table.Cell>
                                    )}
                                    <Table.Cell
                                        className='updated_data_cell'
                                        style={{
                                            overflow: "visible",
                                            width: sizes["update"] ? sizes["update"] + "px" : "150px"
                                        }}
                                    >
                                        <UpdateCell
                                            changedValues={this.props.changedValues}
                                            data={this.props.data}
                                            complexField={this.props.complexField}
                                            rowData={this.props.rowData}
                                            valid={this.state.valid}
                                            element_index={this.props.element_index}
                                            fieldName={name}
                                            blockedFields={this.props.blockedFields}
                                            disabled={this.state.disabled || !this.state.editable}
                                            config={this.props.config}
                                            upward={this.props.show_upward}
                                            errors={this.props.errors}
                                            //field_name={this.props.field_list[this.props.index].text}
                                            convertTime={convertTime}
                                            dataType={this.state.dataType}
                                            setNewValue={this.props.setNewValue}
                                        />
                                    </Table.Cell>
                                    <CommentCell
                                        changedValues={this.props.changedValues}
                                        disabled={this.state.disabled || !this.state.editable}
                                        width={sizes["comment"] ? sizes["comment"] + "px" : "150px"}
                                        fieldName={this.props.element_key}
                                        setComment={this.props.setComment}
                                        previousAudit={this.props.previousAudit}
                                    />
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <td style={{ width: sizes["valid"] ? sizes["valid"] + "px" : "150px" }}></td>
                                    <td style={{ width: sizes["update"] ? sizes["update"] + "px" : "150px" }}></td>
                                    <td style={{ width: sizes["comment"] ? sizes["comment"] + "px" : "150px" }}></td>
                                </React.Fragment>
                            )}
                            <Table.Cell style={{ width: sizes["audit_info"] ? sizes["audit_info"] + "px" : "150px" }}>{this.getInfoPopup()}</Table.Cell>
                        </Table.Row>
                    </Table.Body>
                </Table>
            </div>
        );
    }
}
