import React from "react";
import PropTypes from "prop-types";
import { MoonLoader } from "react-spinners";
import Cookies from "universal-cookie";
import AuditTable from "./AuditTable";
import Footer from "./Footer";
import AuditHeader from "./AuditHeader";
import { setUserConfig } from "../../../lib/api";

let keep_changes = false;
export default class LeftPanel extends React.Component {
    static propTypes = {
        data: PropTypes.array.isRequired,
        RecordId: PropTypes.string.isRequired,
        collectionName: PropTypes.string.isRequired,
        // config: PropTypes.object.isRequired,
        user: PropTypes.object.isRequired,
        isAuthenticated: PropTypes.bool.isRequired,
        history: PropTypes.object.isRequired,
        saveData: PropTypes.func.isRequired,
        getConfig: PropTypes.func.isRequired,
        getDataByFirmID: PropTypes.func.isRequired,
        copyRecord: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            user_name: "",
            audit_info: {
                UserName: "SYSTEM",
                ConfidenceScore: null
            },
            visibleMenu: [],
            complex_fields: [],
            isLoading: true,
            anchor: 0,
            errors: {},
            changedValues: {},
            previousAudit: [],
            deletedFields: [],
            collapsedFields: [],
            auto_fields: [],
            enumerate_fields: [],
            data: null,
            additional_complex_data: {},
            added_subfields: [],
            blockedFields: {},
            table_columns: {},
            table_column_sizes: null
        };
        this.setupData = this.setupData.bind(this);
        this.setNewValue = this.setNewValue.bind(this);
        this.setNewArrayValue = this.setNewArrayValue.bind(this);
        this.unsetArrayValue = this.unsetArrayValue.bind(this);
        this.removeField = this.removeField.bind(this);
        this.collapseField = this.collapseField.bind(this);
        this.restoreField = this.restoreField.bind(this);
        this.removeChanged = this.removeChanged.bind(this);
        this.setComment = this.setComment.bind(this);
        this.prepareData = this.prepareData.bind(this);
        this.addNewArrayRecord = this.addNewArrayRecord.bind(this);
        this.setArrayComment = this.setArrayComment.bind(this);
        this.addNewComplexData = this.addNewComplexData.bind(this);
        this.removeNewComplexObject = this.removeNewComplexObject.bind(this);
        this.setUserView = this.setUserView.bind(this);
        this.setTableSize = this.setTableSize.bind(this);
    }

    componentDidMount() {
        if (this.props.isAuthenticated === false) {
            this.props.history.push("/");
        }
        // this.props.getDataByFirmID();
        this.setState({
            user_name: this.props.user.first_name + " " + this.props.user.last_name
        });
        if (this.props.testing) this.setupData(this.props.data[0]);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if ((this.props.data !== prevProps.data && this.props.config) || (this.props.config !== prevProps.config && this.props.data[0])) {
            this.setupData(this.props.data[0]);
            if (prevState.customMenuOrder)
                this.setState({
                    customMenuOrder: prevState.customMenuOrder,
                    visibleMenu: prevState.visibleMenu.filter((field) => this.state.customMenuOrder.includes(field))
                });
        }
        if (!window.object_schema && this.props.schema) window.object_schema = this.props.schema;
    }

    setTableSize(field, value) {
        let sizes = this.state.table_column_sizes;
        if (!sizes) sizes = [];
        const i = sizes.findIndex((s) => s.key === field);
        if (i >= 0) sizes[i].value = value;
        else sizes.push({ key: field, value: value });
        this.setState({ table_column_sizes: sizes });
    }

    setupData(data, reset) {
        if (!data) data = this.props.data[0];
        const cookies = new Cookies();
        const cookie_config = cookies.get("config");
        const config = cookie_config ? cookie_config : this.props.config;
        let auto_fields = config.update_logics ? config.update_logics.map((t) => t.updated_field) : [];
        auto_fields = [...new Set(auto_fields)];
        if (!data) {
            this.setState({
                isLoading: false
            });
            return;
        }
        if (config.table_column_sizes && !this.state.table_column_sizes) this.setState({ table_column_sizes: config.table_column_sizes });
        if (config && config.DefaultFieldsToDisplayInAuditSession) {
            //if (!config._DefaultFieldsToDisplayInAuditSession && config.user_config && config.user_config.DefaultFieldsToDisplayInAuditSession)
            //    config._DefaultFieldsToDisplayInAuditSession = config.user_config.DefaultFieldsToDisplayInAuditSession;
            const fields = config[reset && config._DefaultFieldsToDisplayInAuditSession ? "_DefaultFieldsToDisplayInAuditSession" : "DefaultFieldsToDisplayInAuditSession"].map(
                (f) => {
                    return f["name"] ? f["name"] : f;
                }
            );
            const UnDisplayableFields = config.UnDisplayableFields || [];
            const visibleMenu = fields.filter(
                (item) => Object.keys(data.CurrentState).includes(item) && !this.state.deletedFields.includes(item) && !UnDisplayableFields.includes(item)
            );
            this.setState({ visibleMenu: [...new Set(visibleMenu)], auto_fields: auto_fields });
        }
        let previous = {};
        data.AuditSessions.map((session) => {
            return session.AuditValueArray.map((val) => {
                let field = val.AuditFieldName;
                if (val.OldValue === null && val.NewValue && val.NewValue["_id"]) field = field + "." + val.NewValue["_id"].toString();
                previous[field] = {
                    valid: val.Valid,
                    who: session.RegisteredUserEmail,
                    when: session.AuditDate,
                    comment: val.AuditedComment,
                    old: val.OldValue
                };
                return {};
            });
        });
        const audit_info = {
            UserName: this.props.user.email,
            ConfidenceScore: data.AuditState.ConfidenceScore,
            NoteOnConfidenceScore: data.AuditState.NoteOnConfidenceScore
        };

        this.setState(
            {
                previousAudit: previous,
                audit_info: audit_info,
                isLoading: false,
                data: this.props.data[0]
            },
            () => {
                const new_data = this.prepareData();
                this.setState({ data: new_data });
            }
        );
        keep_changes = false;
    }

    setNewValue(name, value, clear = false) {
        let changedValues = Object.assign({}, this.state.changedValues);
        if (!changedValues[name]) {
            changedValues[name] = { value: "" };
        }
        changedValues[name]["value"] = value;
        changedValues[name]["valid"] = false;
        if (clear && changedValues[name]) {
            changedValues[name] = { value: "", comment: "", valid: true };
        }
        this.setState({
            changedValues: changedValues
        });
    }

    setNewArrayValue(fieldName, id, subFieldName, value, valid, comment = false, changedValues = null) {
        if (!changedValues) changedValues = Object.assign({}, this.state.changedValues);
        if (!changedValues[fieldName]) {
            changedValues[fieldName] = {};
        }
        if (!changedValues[fieldName]) {
            let sub_field = {};
            sub_field[subFieldName] = { value: value, valid: valid };
            let id_field = {};
            id_field[id] = sub_field;
            changedValues[fieldName] = id_field;
        } else {
            if (changedValues[fieldName][id]) {
                if (changedValues[fieldName][id][subFieldName]) {
                    changedValues[fieldName][id][subFieldName]["value"] = value;
                    changedValues[fieldName][id][subFieldName]["valid"] = valid;
                } else changedValues[fieldName][id][subFieldName] = { value: value, valid: valid };
            } else {
                let sub_field = {};
                sub_field[subFieldName] = { value: value, valid: valid };
                changedValues[fieldName][id] = sub_field;
            }
            if (comment) {
                changedValues[fieldName][id][subFieldName]["comment"] = comment;
            }
        }

        this.setState({
            changedValues: changedValues
        });
        return changedValues;
    }

    unsetArrayValue(fieldName, id, subFieldName, value) {
        let changedValues = Object.assign({}, this.state.changedValues);
        if (changedValues[fieldName] && changedValues[fieldName][id]) {
            let values = changedValues[fieldName][id];
            if (values[subFieldName]) {
                delete values[subFieldName];
                changedValues[fieldName][id] = values;
            }
        }
    }

    addNewArrayRecord(fieldName, record) {
        let changedValues = Object.assign({}, this.state.changedValues);
        if (!changedValues[fieldName]) changedValues[fieldName] = {};
        changedValues[fieldName][record["_id"]] = record["value"];
        this.setState({
            changedValues: changedValues
        });
    }

    setComment(name, value) {
        let changedValues = Object.assign({}, this.state.changedValues);
        if (!changedValues[name]) {
            changedValues[name] = { comment: "" };
        }
        changedValues[name]["comment"] = value;
        this.setState({
            changedValues: changedValues
        });
    }

    setArrayComment(fieldName, id, subFieldName, value, apply_all = false) {
        let changedValues = Object.assign({}, this.state.changedValues);
        if (!changedValues[fieldName]) {
            let sub_field = {};
            sub_field[subFieldName] = { comment: value };
            let id_field = {};
            id_field[id] = sub_field;
            changedValues[fieldName] = id_field;
        } else {
            if (changedValues[fieldName][id]) {
                if (changedValues[fieldName][id][subFieldName]) changedValues[fieldName][id][subFieldName]["comment"] = value;
                else changedValues[fieldName][id][subFieldName] = { comment: value };
            } else {
                let sub_field = {};
                sub_field[subFieldName] = { comment: value };
                changedValues[fieldName][id] = sub_field;
            }
        }
        if (apply_all) {
            this.props.data[0].CurrentState[fieldName].forEach((record) => {
                let new_id = record["_id"];
                if (new_id === id) return;
                if (changedValues[fieldName][new_id][subFieldName]) changedValues[fieldName][new_id][subFieldName]["comment"] = value;
            });
        }
        this.setState({
            changedValues: changedValues
        });
    }

    removeChanged(name, subField = false) {
        let changedValues = Object.assign({}, this.state.changedValues);
        if (changedValues[name]) {
            if (!subField) delete changedValues[name];
            else {
                let arrayValues = changedValues[name];
                Object.keys(arrayValues).forEach((key) => {
                    let new_value = arrayValues[key];
                    if (new_value[subField]) delete new_value[subField];
                    arrayValues[key] = new_value;
                });
                changedValues[name] = arrayValues;
            }
        }
        this.setState({
            changedValues: changedValues
        });
    }

    removeField(item, restore = false) {
        var deletedFields = this.state.deletedFields;
        let changedValues = Object.assign({}, this.state.changedValues);
        if (!deletedFields.includes(item) && !restore) {
            if (changedValues[item]) {
                delete changedValues[item];
            }
            deletedFields.push(item);
            this.setState({
                changedValues: changedValues,
                deletedFields: deletedFields,
                visibleMenu: this.state.visibleMenu.filter((field) => field !== item)
            });
        }
        if (deletedFields.includes(item) && restore) {
            let i = deletedFields.findIndex((t) => t === item);
            deletedFields.splice(i, 1);
            this.setState({
                changedValues: changedValues,
                deletedFields: deletedFields,
                visibleMenu: this.state.visibleMenu.concat([item])
            });
            //this.setupData(this.props.data[0]);
        }
    }

    collapseField(item, restore = false) {
        var collapsedFields = this.state.collapsedFields;
        if (!collapsedFields.includes(item) && !restore) {
            collapsedFields.push(item);
            this.setState({
                collapsedFields: collapsedFields
            });
        }
        if (collapsedFields.includes(item) && restore) {
            let i = collapsedFields.findIndex((t) => t === item);
            collapsedFields.splice(i, 1);
            this.setState({
                collapsedFields: collapsedFields
            });
            //this.setupData(this.props.data[0]);
        }
    }

    setUserView() {
        const ob_fields = this.props.config.DefaultFieldsToDisplayInAuditSession.filter((f) => typeof f !== "string");
        const fields = this.state.visibleMenu.map((f) => {
            let table_field = ob_fields.find((f1) => f1.name === f);
            if (table_field) {
                if (this.state.table_columns[f]) table_field.DefaultFieldsToDisplayInAuditSession = this.state.table_columns[f];
                return table_field;
            } else return f;
        });
        setUserConfig(
            {
                DefaultFieldsToDisplayInAuditSession: fields,
                table_column_sizes: this.state.table_column_sizes
            },
            this.props.collectionName
        ).then(() => {
            this.props.getConfig(this.props.collectionName);
            localStorage.setItem("view", "personalised");
            setTimeout(() => this.setupData(), 2000);
        });
    }

    restoreField(field) {
        var deletedFields = this.state.deletedFields.slice(0);
        deletedFields = deletedFields.filter((item) => item !== field);
        if (deletedFields.length !== this.state.deletedFields.length) {
            this.setState({
                deletedFields: deletedFields
            });
        } else {
            if (this.props.config.ComplexFields && this.props.config.ComplexFields.includes(field.split(".")[0])) {
                var added_subfields = this.state.added_subfields.slice(0);
                added_subfields.push(field);
                this.setState({ added_subfields: added_subfields });
            }
        }
        this.setupData(this.props.data[0]);
    }

    addNewComplexData(fieldName) {
        let complex_fields_array = this.props.config.DefaultFieldsToDisplayInAuditSession.find((f) => f["nested_fields"] && f.name === fieldName);
        if (complex_fields_array) {
            let new_element = {};
            complex_fields_array.nested_fields.forEach((f) => {
                if (f.name && f.DefaultFieldsToDisplayInAuditSession) new_element[f.name] = [];
                else new_element[f] = "";
            });
            let new_data = Object.assign({}, this.state.additional_complex_data);
            if (!new_data[complex_fields_array.name]) {
                new_data[complex_fields_array.name] = [new_element];
            } else {
                new_data[complex_fields_array.name].push(new_element);
            }
            let changedValues = Object.assign({}, this.state.changedValues);
            const changed_index = this.state.data.CurrentState[fieldName].length + (this.state.additional_complex_data[fieldName] || []).length;
            this.setState({ additional_complex_data: new_data }, () => {
                new_data = this.prepareData();
                complex_fields_array.nested_fields.forEach((f) => {
                    const k = f.name ? f.name : f;
                    const v = f.name && f.DefaultFieldsToDisplayInAuditSession ? [] : "";
                    changedValues[fieldName + ".index" + changed_index + "." + k] = { valid: false, value: v };
                });
                this.setState({
                    data: new_data,
                    changedValues: changedValues
                });
            });
        }
    }

    removeNewComplexObject(field, index) {
        let new_objects = this.state.additional_complex_data[field].slice(0);
        if (new_objects[index]) {
            new_objects.splice(index, 1);
            const changed_index = this.state.data.CurrentState[field].length + index;
            let changedValues = Object.assign({}, this.state.changedValues);
            Object.keys(changedValues).forEach((key) => {
                if (key.startsWith(field + ".index" + changed_index + ".")) delete changedValues[key];
            });
            let new_data = Object.assign({}, this.state.additional_complex_data);
            new_data[field] = new_objects;
            this.setState({ additional_complex_data: new_data }, () => {
                const new_data1 = this.prepareData();

                this.setState({
                    data: new_data1,
                    changedValues: changedValues
                });
            });
        }
    }

    prepareData() {
        let data = Object.assign({}, this.props.data[0]);
        let state = data.CurrentState;
        let new_menus = {};
        let enumerate_fields = this.props.config.Validators.filter((f) => {
            try {
                if (f["type"] && f["type"].includes("array")) return true;
            } catch {
                return false;
            }
            return false;
        }).map((f) => f.name);
        let complex_fields_array = this.props.config.DefaultFieldsToDisplayInAuditSession.filter((f) => f["nested_fields"]);
        complex_fields_array.forEach((field_array) => {
            const field = field_array.name;
            if (!state[field]) return;
            let data = state[field].concat((this.state.additional_complex_data && this.state.additional_complex_data[field]) || []);
            data.forEach((d, key) => {
                if (!new_menus[key]) new_menus[key] = [];
                if (!data) return;
                field_array.nested_fields
                    .concat("_id")
                    .concat(this.state.added_subfields.filter((f) => f.startsWith(field + ".")).map((f) => f.split(".")[2]))
                    .forEach((k) => {
                        if (typeof k !== "string") return;
                        const s = field + ".index" + key + "." + k;
                        state[s] = data[key][k];
                        new_menus[key].push(s);
                        if (enumerate_fields.includes(field + "." + k)) enumerate_fields.push(s);
                    });
            });
        });
        this.setState({ complex_fields: new_menus, enumerate_fields: enumerate_fields });

        data.CurrentState = state;
        return data;
    }

    render() {
        const { RecordId, collectionName } = this.props;
        let content = (
            <div>
                <MoonLoader sizeUnit={"px"} size={100} color={"#A4DA2A"} loading={this.state.loading} />
            </div>
        );
        if (!this.state.isLoading && this.props.config) {
            content = (
                <React.Fragment>
                    <div className='sticky-header'>
                        <AuditHeader
                            audit_info={this.state.audit_info}
                            visibleMenu={this.state.visibleMenu}
                            deletedFields={this.state.deletedFields}
                            data={this.props.data[0]}
                            schema={this.props.schema}
                            getDataByFirmID={this.props.getDataByFirmID}
                            RecordId={RecordId}
                            config={this.props.config}
                            show_fields={this.props.show_fields}
                            anchor={this.state.anchor}
                            collectionName={collectionName}
                            show_fields_button={this.props.config.FieldsToDisplayOnMiddleScreen && this.props.show_fields_button}
                            addAuditField={(visibleMenu) => this.setState({ visibleMenu: visibleMenu })}
                            restoreField={(field) => this.restoreField(field)}
                        />
                    </div>
                    <AuditTable
                        visibleMenu={this.state.visibleMenu}
                        visibleComplexMenu={this.state.complex_fields}
                        deletedFields={this.state.deletedFields}
                        collapsedFields={this.state.collapsedFields}
                        schema={this.props.schema}
                        data={this.state.data}
                        additional_complex_data={this.state.additional_complex_data}
                        enumerate_fields={this.state.enumerate_fields}
                        setUserView={() => this.setUserView()}
                        setDefaultConfig={(t) => {
                            this.setState({ deletedFields: [] }, () => this.setupData(this.props.data[0]));
                            this.props.setDefaultConfig(t);
                        }}
                        setupData={this.setupData}
                        config={this.props.config}
                        previousAudit={this.state.previousAudit}
                        changedValues={this.state.changedValues}
                        table_column_sizes={this.state.table_column_sizes}
                        addNewArrayRecord={this.addNewArrayRecord}
                        addNewComplexData={this.addNewComplexData}
                        errors={this.state.errors}
                        setNewValue={this.setNewValue}
                        setNewArrayValue={this.setNewArrayValue}
                        unsetArrayValue={this.unsetArrayValue}
                        auto_fields={this.state.auto_fields}
                        setComment={this.setComment}
                        setTableSize={this.setTableSize}
                        setArrayComment={this.setArrayComment}
                        setChangedValues={(values) => this.setState({ changedValues: values })}
                        removeChanged={this.removeChanged}
                        removeField={(index, restore = false) => this.removeField(index, restore)}
                        collapseField={(index, restore = false) => this.collapseField(index, restore)}
                        removeNewComplexObject={(field, index) => this.removeNewComplexObject(field, index)}
                        setVisibleMenu={(new_menu) => {
                            this.setState({ visibleMenu: new_menu, customMenuOrder: new_menu });
                        }}
                        setBlockedFields={(fields) => {
                            this.setState({ blockedFields: fields });
                        }}
                        setTableColumns={(columns) => {
                            this.setState({ table_columns: columns });
                        }}
                    />
                    <Footer
                        audit_info={this.state.audit_info}
                        previousAudit={this.state.previousAudit}
                        additional_complex_data={this.state.additional_complex_data}
                        data={this.state.data}
                        blockedFields={this.state.blockedFields}
                        config={this.props.config}
                        auditState={this.props.data[0] ? this.props.data[0]["AuditState"] : null}
                        RecordId={RecordId}
                        changedValues={this.state.changedValues}
                        collectionName={collectionName}
                        user={this.props.user}
                        saveData={this.props.saveData}
                        isUpdating={this.props.isUpdating}
                        copyRecord={this.props.copyRecord}
                        setConfidence={(audit_info) => this.setState({ audit_info: audit_info })}
                        updateRecord={(changedValues, errors, additional_complex_data) => {
                            keep_changes = Object.keys(changedValues).length > 0;
                            this.setState(
                                {
                                    changedValues: changedValues,
                                    additional_complex_data: additional_complex_data,
                                    errors: errors
                                },
                                () => {
                                    var error_message_element = document.querySelectorAll(".error_message");
                                    if (error_message_element.length > 0) {
                                        error_message_element[0].parentElement.scrollIntoView();
                                        var position_top = error_message_element[0].parentElement.getBoundingClientRect().top;
                                        if (position_top < 100) document.querySelector(".dialogContainer").parentElement.scrollBy(0, -position_top - 100);
                                    }
                                }
                            );
                        }}
                    />
                </React.Fragment>
            );
        }
        return <div className='dialogContainer'>{this.props.error ? this.props.error : content}</div>;
    }
}
