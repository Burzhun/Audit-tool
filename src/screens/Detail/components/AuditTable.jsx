import React from "react";
import PropTypes from "prop-types";
import {Button, Dropdown, Icon, Table} from "semantic-ui-react";
import TableHeader from "./Header";
import TableRow from "./Row";
import ArrayRow from "./ArrayRow";
import DoubleScrollbar from "react-double-scrollbar";
import {DragDropContext, Droppable} from "react-beautiful-dnd";
import FileContext from "./FileContext";
import collapse_img from "../../../images/minus.png";
import uncollapse from "../../../images/plus.png";
import SearchFilterList from "../../Dashboard/SearchFilterList";

export default class AuditTable extends React.Component {
    static propTypes = {
        data: PropTypes.object.isRequired,
        visibleMenu: PropTypes.array.isRequired,
        config: PropTypes.object.isRequired,
        changedValues: PropTypes.object.isRequired,
        previousAudit: PropTypes.object.isRequired,
        setNewValue: PropTypes.func.isRequired,
        setComment: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            view: localStorage.getItem("view") || "default",
            complex_fields: [],
            validity: {},
            sizes: {},
            dragDisabled: false,
            blockedFields: {},
            deletedCmplexFields: [],
            tableColumns: {},
            object_filters: {}
        };
        this.setValidity = this.setValidity.bind(this);
        this.setArrayValueValidity = this.setArrayValueValidity.bind(this);
        this.getRowData = this.getRowData.bind(this);
        this.setTableFieldSize = this.setTableFieldSize.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.getBlockingFields = this.getBlockingFields.bind(this);
        this.onDragStart = this.onDragStart.bind(this);
        this.rowCode = this.rowCode.bind(this);
        this.deleteElement = this.deleteElement.bind(this);
        window.dragDisabled = false;
        this.props.setupData(null, this.state.view === "default");
    }

    componentDidMount() {
        const complexFields = this.props.config.DefaultFieldsToDisplayInAuditSession.filter((f) => f["nested_fields"]).map((f) => f.name);
        this.setState({complex_fields: complexFields}, () => {
            this.getBlockingFields();
        });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.previousAudit !== this.props.previousAudit) {
            this.setState({validity: {}, deletedCmplexFields: []});
            this.getBlockingFields();
        }
        if (prevProps.changedValues !== this.props.changedValues) {
            this.getBlockingFields();
        }
    }

    getBlockingFields() {
        let blockingFields = {};
        if (this.state.complex_fields.length > 0 && this.props.config) {
            const rules = this.props.config.BusinessRules.find((v) => v.RuleType === "BlockingValues");
            (rules || {Rules: []}).Rules.forEach((rule) => {
                if (!rule.enabled) return;
                const ar = rule.field.replace("CurrentState.", "").split(".");
                const records = this.props.data.CurrentState[ar[0]].concat((this.props.additional_complex_data && this.props.additional_complex_data[ar[0]]) || []);
                if (ar.length === 2 && this.state.complex_fields.includes(ar[0])) {
                    const subKey = ar[1];
                    let blocking = {};
                    if (Array.isArray(records) && records.length > 0) {
                        if (rule.groupFields.length > 0) {
                            records.forEach((el, index) => {
                                if (this.state.deletedCmplexFields.includes(index + "")) return;
                                const changedValueKey1 = this.props.changedValues[[ar[0], "index" + index, subKey].join(".")];
                                let valueKey1 = changedValueKey1 && !changedValueKey1.valid ? changedValueKey1.value : el[subKey];
                                let blocking_records = [];
                                let blocked = false;
                                let group_values = {};
                                records.forEach((r, index2) => {
                                    if (index === index2 || this.state.deletedCmplexFields.includes(index2 + "")) return;
                                    const changedValueKey2 = this.props.changedValues[[ar[0], "index" + index2, subKey].join(".")];
                                    let valueKey2 = changedValueKey2 && !changedValueKey2.valid ? changedValueKey2.value : r[subKey];
                                    group_values = {};
                                    if (
                                        rule.groupFields.find((group_field_ar) => {
                                            const group_field = group_field_ar.split(".").pop();
                                            const changedValue1 = this.props.changedValues[[ar[0], "index" + index, group_field].join(".")];
                                            const changedValue2 = this.props.changedValues[[ar[0], "index" + index2, group_field].join(".")];
                                            let value1 = changedValue1 && !changedValue1.valid ? changedValue1.value : el[group_field];
                                            let value2 = changedValue2 && !changedValue2.valid ? changedValue2.value : r[group_field];
                                            group_values[group_field] = value1;
                                            if (Array.isArray(value1) && Array.isArray(value2)) {
                                                return value1.findIndex((k) => value2.includes(k)) < 0;
                                            } else {
                                                return value1 !== value2;
                                            }
                                        })
                                    ) {
                                        return null;
                                    } else {
                                        if (valueKey2 && valueKey2.includes(rule.blockingValue)) {
                                            blocked = true;
                                        }
                                        blocking_records.push(index2);
                                    }
                                });
                                if (blocking_records.length) {
                                    blocking[index] = {
                                        values: blocking_records,
                                        blocked: blocked,
                                        blockingValue: rule.blockingValue,
                                        group_values: group_values
                                    };
                                }
                            });
                        }
                        if (Object.keys(blocking).length) {
                            blockingFields[rule.field.replace("CurrentState.", "")] = {
                                value: rule.blockingValue,
                                index: blocking
                            };
                        }
                    }
                }
            });
        }
        this.setState({blockedFields: blockingFields});
        this.props.setBlockedFields(blockingFields);
    }

    setValidity(rowData, value) {
        const fieldName = rowData.name;
        const validity = Object.assign({}, this.state.validity);
        validity[fieldName] = value;
        this.setState({validity: validity});
        if (value === 0) this.props.removeChanged(rowData.name);
    }

    setArrayValueValidity(fieldName, id, subFieldName, value, set_all = false) {
        const validity = Object.assign({}, this.state.validity);
        if (!validity[fieldName]) {
            let sub_field = {};
            sub_field[subFieldName] = value;
            let id_field = {};
            id_field[id] = sub_field;
            validity[fieldName] = id_field;
        } else {
            if (validity[fieldName][id]) validity[fieldName][id][subFieldName] = value;
            else {
                let sub_field = {};
                sub_field[subFieldName] = value;
                validity[fieldName][id] = sub_field;
            }
        }
        this.setState({validity: validity});
        if (value === 0 && set_all) this.props.removeChanged(fieldName, subFieldName);
    }

    getRowData(element) {
        let rowData = {value: this.props.data.CurrentState[element], name: element};
        rowData["valid"] = 0;
        if (Object.keys(this.state.validity).includes(element) && Object.keys(this.props.changedValues).includes(element)) {
            rowData["valid"] = this.state.validity[element];
        }
        return rowData;
    }

    setTableFieldSize(field, size) {
        let sizes = this.state.sizes;
        sizes[field] = size;
        this.setState({sizes: sizes});
    }

    onDragEnd(result) {
        if (!result.destination) {
            return;
        }
        let menu = this.props.visibleMenu;
        var element = menu[result.source.index];
        menu.splice(result.source.index, 1);
        menu.splice(result.destination.index, 0, element);
        this.props.setVisibleMenu(menu);
    }

    onDragStart(e) {
        return;
    }

    rowCode(element, drag_provided, row_count, context, index, new_key = null, is_array = false, element_index = -1) {
        let view = localStorage.getItem("view") || "default";
        if (!this.props.config.user_config) view = "default";
        let fields = view === ("default" ? this.props.config._DefaultFieldsToDisplayInAuditSession : this.props.config.user_config.DefaultFieldsToDisplayInAuditSession) || [];
        let show_row = new_key ? !is_array : !(Array.isArray(this.props.data.CurrentState[element]) && !this.props.enumerate_fields.includes(element));
        if (this.props.deletedFields.includes(element)) {
            return null;
        }
        if (this.props.collapsedFields.includes(element)) {
            if (!show_row)
                return (
                    <div key={"element_collapsed" + element} className='detail_table_array detail_table_array_removed'>
                        <span data-qa={new_key} className='array_field_title'>
                            {new_key ? new_key : element}
                        </span>
                        <span className='left_collapse_button2'>
                            <img onClick={() => this.props.collapseField(element, true)} src={uncollapse}
                                 style={{width: "30px"}}/>
                        </span>
                    </div>
                );
            return null;
        }
        let data = this.props.data.CurrentState[new_key ? new_key.split(".")[0] : element] || [];
        if (Array.isArray(data)) data = data.concat((new_key && (this.props.additional_complex_data || {})[new_key.split(".")[0]]) || []);

        // if ("collection_table" !== element && !(fields.includes(element) || (this.props.visibleMenu || []).includes(element))) return null;

        // if ("collection_table" === element) {
        //     const field = fields.find((f) => typeof f !== "string" && f.name === "collection_table");
        //     if (field) {
        //         fields = field.DefaultFieldsToDisplayInAuditSession;
        //     }
        // }

        return show_row ? (
            <TableRow
                key={`audit-row-${element}${index}`}
                rowData={this.getRowData(element)}
                config={this.props.config}
                element_index={parseInt(element_index)}
                data={data}
                element_key={element}
                previousAudit={this.props.previousAudit}
                changedValues={this.props.changedValues}
                errors={this.props.errors}
                blockedFields={this.state.blockedFields}
                drag_provided={drag_provided}
                setTableFieldSize={this.setTableFieldSize}
                // ref_prop={provided.innerRef}
                sizes={this.state.sizes}
                show_upward={row_count - index < 3 && index > 2}
                setNewValue={this.props.setNewValue}
                setComment={this.props.setComment}
                setValidity={this.setValidity}
                removeField={() => this.props.removeField(element)}
                fieldName={new_key ? new_key : element}
                complexField={!!new_key}
                auto_field={this.props.auto_fields.includes(element)}
            />
        ) : (
            <ArrayRow
                data={this.props.data.CurrentState[element]}
                sessions={this.props.data.AuditSessions}
                // ref_prop={drag_provided.innerRef}
                key={`audit-row-${element}${index}`}
                schema={this.props.schema}
                chart_context={context}
                // drag_provided={drag_provided}
                config={this.props.config}
                setTableColumnSize={this.props.setTableSize}
                changedValues={this.props.changedValues}
                addNewArrayRecord={this.props.addNewArrayRecord}
                previousAudit={this.props.previousAudit}
                errors={this.props.errors}
                setArrayComment={this.props.setArrayComment}
                removeField={() => this.props.removeField(element)}
                collapseField={() => this.props.collapseField(element)}
                validity={this.state.validity}
                setNewArrayValue={this.props.setNewArrayValue}
                unsetArrayValue={this.props.unsetArrayValue}
                setChangedValues={this.props.setChangedValues}
                setArrayValueValidity={this.setArrayValueValidity}
                fieldName={new_key ? new_key : element}
                element_key={element}
                tableColumns={this.state.tableColumns[new_key ? new_key : element]}
                setTableColumn={(field, columns) => {
                    var t = {};
                    t[field] = columns;
                    const new_columns = Object.assign(this.state.tableColumns, t);
                    this.setState({tableColumns: new_columns});
                    this.props.setTableColumns(new_columns);
                }}
                complexField={!!new_key}
            />
        );
    }

    deleteElement(e, i) {
        let fields = this.state.deletedCmplexFields.slice(0);
        if (fields.includes(i)) {
            const j = fields.findIndex((t) => t === i);
            fields.splice(j, 1);
            this.setState({deletedCmplexFields: fields}, () => {
                this.getBlockingFields();
            });
            if (i < this.props.data.CurrentState[e].length) {
                const id = this.props.data.CurrentState[e + ".index" + i + "._id"];
                this.props.setNewArrayValue(e + "._id", id, "delete", false, false, false);
            }
            return;
        }
        fields.push(i);
        this.setState({deletedCmplexFields: fields}, () => {
            this.getBlockingFields();
        });
        if (i >= this.props.data.CurrentState[e].length) {
            this.props.removeNewComplexObject(e, i - this.props.data.CurrentState[e].length);
            return;
        }
        const id = this.props.data.CurrentState[e + ".index" + i + "._id"];
        this.props.setNewArrayValue(e + "._id", id, "delete", true, false, false);
    }

    checkObjectFilter(data, key, index, object_filters) {
        const element = data[key] ? data[key][index] : false;
        if (!element) return false;
        for (var i = 0; i < object_filters[key].length; i++) {
            const filter = object_filters[key][i];
            if (!filter.operator || !filter.selectedField) continue;
            const is_array = Array.isArray(element[filter.selectedField]);
            const object_data = is_array ? element[filter.selectedField].map((f) => f.toLowerCase()) : (element[filter.selectedField] || "").toLowerCase();
            const value = filter.value.toLowerCase();
            switch (filter.operator) {
                case "=":
                    if ((is_array && !object_data.find((f) => f.toString().includes(value))) || (!is_array && !object_data.includes(value))) return false;
                    break;
                case "!=":
                    if ((is_array && object_data.find((f) => f.toString().includes(value))) || (!is_array && object_data.includes(value))) return false;
                    break;
                case "<":
                    if (object_data > filter.value) return false;
                    break;
                case ">":
                    if (object_data < filter.value) return false;
                    break;
            }
        }
        return true;
    }

    changeView(view) {
        this.setState({
            ...this.state,
            view,
            tableColumns: {}
        });
        this.props.setTableColumns({});
        localStorage.setItem("view", view);
        this.props.setupData(null, view === "default");
        this.props.setDefaultConfig(view === "default");
    }

    render() {
        const row_count = this.props.visibleMenu ? this.props.visibleMenu.length : 0;
        const exception_fields = this.props.config.updates_manual_overwrite_fields || [];
        const auto_updated_fields = this.props.config.update_logics
            ? this.props.config.update_logics.reduce((ar, l) => {
                if (!exception_fields.includes(l.updated_field)) ar.push(l.updated_field);
                return ar;
            }, [])
            : [];
        let complex_array_fields = [];
        this.props.config.DefaultFieldsToDisplayInAuditSession.filter((f) => f["nested_fields"]).forEach((field) => {
            const mainField = field.nested_fields;
            complex_array_fields = complex_array_fields.concat(mainField.filter((f) => f["DefaultFieldsToDisplayInAuditSession"]).map((f) => field.name + "." + f.name));
        });
        const forms_collapsed = this.props.collapsedFields.includes("form_headers");
        return (
            <FileContext.Consumer>
                {(context) => (
                    <React.Fragment>
                        {auto_updated_fields.length > 0 && (
                            <div data-qa='auto-updated-fields'>
                                <b>Auto updated fields:</b> {auto_updated_fields.join(", ")}
                            </div>
                        )}
                        {exception_fields && exception_fields.length > 0 && (
                            <div data-qa='manual-override-fields'>
                                <b>Manual override fields:</b> {exception_fields.join(", ")}
                            </div>
                        )}
                        <div className='detail_user_view_buttons'>
                            <Button
                                color='teal'
                                data-qa='set-config-field'
                                onClick={() => {
                                    this.props.setUserView();
                                }}
                            >
                                Save&nbsp;User&nbsp;View
                            </Button>
                            <Dropdown
                                data-qa="select-view"
                                placeholder='Select view'
                                fluid
                                selection
                                value={localStorage.getItem("view") || this.state.view}
                                onChange={(e, {value}) => {
                                    this.changeView(value);
                                }}
                                options={[
                                    {
                                        key: "default",
                                        text: "Default view",
                                        value: "default",
                                        "data-qa": "default"
                                    },
                                    {
                                        key: "personalised",
                                        text: "Personalised view",
                                        value: "personalised",
                                        "data-qa": "personalised"
                                    }
                                ]}
                            />
                        </div>
                        <div className='auditTable' style={{display: "flex"}}>
                            <div style={{width: "100%", marginRight: "20px"}}>
                                <DoubleScrollbar>
                                    <Table striped fixed textAlign='center' className='detail_table'>
                                        <TableHeader AuditDropdownVisible={this.props.config.AuditDropdownVisible}
                                                     sizes={this.state.sizes} setWidth={this.setTableFieldSize}/>
                                    </Table>
                                    <DragDropContext onDragUpdate={this.onDragStart} onDragEnd={this.onDragEnd}>
                                        <Droppable droppableId='droppable'>
                                            {(provided, snapshot) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                                    <div
                                                        style={{
                                                            position: "relative",
                                                            minHeight: "37px",
                                                            border: "1px solid black",
                                                            maxWidth: "100%",
                                                            overflow: "hidden",
                                                            marginBottom: "10px"
                                                        }}
                                                    >
                                                        <div style={{
                                                            padding: "5px",
                                                            minHeight: "40px",
                                                            borderBottom: forms_collapsed ? "none" : "1px solid black"
                                                        }}>
                                                            Form headers
                                                            {forms_collapsed && (
                                                                <Table>
                                                                    <Table.Header>
                                                                        <Table.Row>
                                                                            <Table.HeaderCell
                                                                                style={{margin: "0 5px"}}></Table.HeaderCell>
                                                                            {this.props.visibleMenu.map((element, index) => {
                                                                                if (!this.state.complex_fields.includes(element))
                                                                                    return <Table.HeaderCell
                                                                                        style={{margin: "0 5px"}}>{element}</Table.HeaderCell>;
                                                                            })}
                                                                        </Table.Row>
                                                                    </Table.Header>
                                                                    <Table.Body>
                                                                        <Table.Row>
                                                                            <Table.Cell style={{margin: "0 5px"}}>
                                                                                <img
                                                                                    onClick={() => {
                                                                                        this.props.collapseField("form_headers", forms_collapsed);
                                                                                    }}
                                                                                    src={uncollapse}
                                                                                    style={{
                                                                                        width: "30px",
                                                                                        cursor: "pointer"
                                                                                    }}
                                                                                />
                                                                            </Table.Cell>
                                                                            {this.props.visibleMenu.map((element, index) => {
                                                                                if (!this.state.complex_fields.includes(element))
                                                                                    return (
                                                                                        <Table.Cell
                                                                                            style={{margin: "0 5px"}}>
                                                                                            {(this.props.data.CurrentState[element] || "").toString()}
                                                                                        </Table.Cell>
                                                                                    );
                                                                            })}
                                                                        </Table.Row>
                                                                    </Table.Body>
                                                                </Table>
                                                            )}
                                                            {!forms_collapsed && (
                                                                <span className='left_collapse_button'>
                                                                    <img
                                                                        onClick={() => {
                                                                            this.props.collapseField("form_headers", forms_collapsed);
                                                                        }}
                                                                        src={forms_collapsed ? uncollapse : collapse_img}
                                                                        style={{width: "30px"}}
                                                                    />
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!forms_collapsed && (
                                                            <div style={{padding: "5px"}}>
                                                                {this.props.visibleMenu.map((element, index) => {
                                                                    if (!this.state.complex_fields.includes(element))
                                                                        return this.rowCode(element, provided, row_count, context, index);
                                                                    else {
                                                                        let block_adding = false;
                                                                        const element_collapsed = this.props.collapsedFields.includes(element);
                                                                        const sub_fields = this.props.config.DefaultFieldsToDisplayInAuditSession.find((t) => t.name === element);
                                                                        let last_element_collapsed = false;
                                                                        let element_found = false;
                                                                        let table_fields = sub_fields.nested_fields
                                                                            .filter((f) => f.DefaultFieldsToDisplayInAuditSession)
                                                                            .map((f) => f.name);
                                                                        return (
                                                                            <div key={"complex_field" + element}
                                                                                 style={{
                                                                                     border: "1px solid black",
                                                                                     position: "relative"
                                                                                 }}>
                                                                                <span className='left_collapse_button'>
                                                                                    <img
                                                                                        onClick={() => {
                                                                                            this.props.collapseField(element, element_collapsed);
                                                                                        }}
                                                                                        src={element_collapsed ? uncollapse : collapse_img}
                                                                                        style={{width: "30px"}}
                                                                                    />
                                                                                </span>
                                                                                <span
                                                                                    style={{
                                                                                        display: "inline-block",
                                                                                        verticalAlign: "top",
                                                                                        fontSize: "21px",
                                                                                        marginTop: "10px",
                                                                                        textTransform: "capitalize"
                                                                                    }}
                                                                                    data-qa={element}
                                                                                >
                                                                                    {element}
                                                                                </span>
                                                                                <span
                                                                                    className='filters object_filters'>
                                                                                    {sub_fields && (
                                                                                        <SearchFilterList
                                                                                            key={"searchfilterlist" + element}
                                                                                            el={element}
                                                                                            searchValue={null}
                                                                                            maxNumber={5}
                                                                                            secondSearchValue={null}
                                                                                            selectedSearchField={null}
                                                                                            searchItem={(filters) => {
                                                                                                var t = {};
                                                                                                t[element] = filters;
                                                                                                this.setState({object_filters: Object.assign(this.state.object_filters, t)});
                                                                                            }}
                                                                                            config={this.props.config}
                                                                                            searchFields={sub_fields.nested_fields.filter(
                                                                                                (f) => typeof f === "string" && !table_fields.includes(f)
                                                                                            )}
                                                                                            config_name={this.props.config.CollectionRelevantFor}
                                                                                            isObjectFilter={true}
                                                                                            filters={this.state.object_filters[element]}
                                                                                            isMiniSearch={true}
                                                                                        />
                                                                                    )}
                                                                                </span>
                                                                                {!element_collapsed && (
                                                                                    <div style={{padding: "10px"}}>
                                                                                        {Object.keys(this.props.visibleComplexMenu).map((menu_index) => {
                                                                                            const id = this.props.data.CurrentState[element + ".index" + menu_index + "._id"];
                                                                                            let del = false;
                                                                                            if (this.props.changedValues[element + "._id"]) {
                                                                                                const del_key = Object.keys(this.props.changedValues[element + "._id"]).find(
                                                                                                    (k) => k === id
                                                                                                );
                                                                                                if (
                                                                                                    del_key &&
                                                                                                    this.props.changedValues[element + "._id"][del_key]["delete"] &&
                                                                                                    this.props.changedValues[element + "._id"][del_key]["delete"]["value"]
                                                                                                )
                                                                                                    del = true;
                                                                                            }
                                                                                            if (this.state.object_filters[element]) {
                                                                                                if (
                                                                                                    !this.checkObjectFilter(
                                                                                                        this.props.data.CurrentState,
                                                                                                        element,
                                                                                                        menu_index,
                                                                                                        this.state.object_filters
                                                                                                    )
                                                                                                )
                                                                                                    return null;
                                                                                            }
                                                                                            element_found = true;
                                                                                            let rows = [];
                                                                                            let tables = [];
                                                                                            let table_headers = [];
                                                                                            let show_table_buttons = [];
                                                                                            const collapse = this.props.collapsedFields.includes(element + "." + menu_index);
                                                                                            let show_delete_button = !collapse;
                                                                                            this.props.visibleComplexMenu[menu_index].forEach((k, i) => {
                                                                                                const ar = k.split(".");
                                                                                                const new_key = ar[0] + "." + ar[2];
                                                                                                if (this.state.blockedFields[new_key] && this.state.blockedFields[new_key].index) {
                                                                                                    if (
                                                                                                        Object.values(this.state.blockedFields[new_key].index).find(
                                                                                                            (f) => f.blocked
                                                                                                        )
                                                                                                    )
                                                                                                        block_adding = true;
                                                                                                }

                                                                                                const is_array = complex_array_fields.includes(new_key); //is it a nested table
                                                                                                if (ar[2] === "_id") return null;
                                                                                                if (is_array) {
                                                                                                    if (this.props.collapsedFields.includes(k)) {
                                                                                                        if (collapse) {
                                                                                                            rows = [
                                                                                                                <Table.Cell
                                                                                                                    key={"table_header" + element + menu_index + k}
                                                                                                                    style={{margin: "0 5px"}}
                                                                                                                >
                                                                                                                    <img
                                                                                                                        onClick={() => {
                                                                                                                            this.props.collapseField(k, true);
                                                                                                                        }}
                                                                                                                        src={uncollapse}
                                                                                                                        style={{
                                                                                                                            width: "30px",
                                                                                                                            cursor: "pointer"
                                                                                                                        }}
                                                                                                                    />
                                                                                                                </Table.Cell>
                                                                                                            ].concat(rows);
                                                                                                            table_headers = [
                                                                                                                <Table.HeaderCell
                                                                                                                    key={"table_header" + element + menu_index + k}
                                                                                                                    style={{margin: "0 5px"}}
                                                                                                                >
                                                                                                                    {ar[2]}
                                                                                                                </Table.HeaderCell>
                                                                                                            ].concat(table_headers);
                                                                                                        } else {
                                                                                                            show_table_buttons.push(
                                                                                                                <Button
                                                                                                                    style={{margin: "10px"}}
                                                                                                                    onClick={() => {
                                                                                                                        this.props.collapseField(k, true);
                                                                                                                    }}
                                                                                                                >
                                                                                                                    <Icon
                                                                                                                        name='arrow down'/> {ar[2]}
                                                                                                                </Button>
                                                                                                            );
                                                                                                        }
                                                                                                    } else {
                                                                                                        tables.push(
                                                                                                            this.rowCode(
                                                                                                                k,
                                                                                                                provided,
                                                                                                                row_count,
                                                                                                                context,
                                                                                                                i,
                                                                                                                new_key,
                                                                                                                is_array,
                                                                                                                menu_index
                                                                                                            )
                                                                                                        );
                                                                                                        show_delete_button = true;
                                                                                                    }
                                                                                                } else {
                                                                                                    if (!collapse) {
                                                                                                        rows.push(
                                                                                                            this.rowCode(
                                                                                                                k,
                                                                                                                provided,
                                                                                                                row_count,
                                                                                                                context,
                                                                                                                i,
                                                                                                                new_key,
                                                                                                                is_array,
                                                                                                                menu_index
                                                                                                            )
                                                                                                        );
                                                                                                    } else {
                                                                                                        rows.push(
                                                                                                            <Table.Cell
                                                                                                                key={"table_header" + element + menu_index + k}
                                                                                                                style={{cursor: "pointer"}}
                                                                                                                onClick={() => {
                                                                                                                    this.props.collapseField(element + "." + menu_index, true);
                                                                                                                }}
                                                                                                            >
                                                                                                                {(this.props.data.CurrentState[k] || "").toString()}
                                                                                                            </Table.Cell>
                                                                                                        );
                                                                                                        table_headers.push(
                                                                                                            <Table.HeaderCell
                                                                                                                key={"table_header" + element + menu_index + k}
                                                                                                                style={{margin: "0 5px"}}
                                                                                                            >
                                                                                                                {ar[2]}
                                                                                                            </Table.HeaderCell>
                                                                                                        );
                                                                                                    }
                                                                                                }
                                                                                            });
                                                                                            const show_headers = (!show_delete_button || collapse) && !last_element_collapsed; //don't show headers if this and last objects are collapsed
                                                                                            last_element_collapsed = !show_delete_button;
                                                                                            return (
                                                                                                <div
                                                                                                    className={(!show_delete_button ? "collpased_" : "") + "object_element"}
                                                                                                    key={menu_index + id}
                                                                                                    style={{borderColor: del ? "red" : "black"}}
                                                                                                >
                                                                                                    {collapse ? (
                                                                                                        <div
                                                                                                            className='collapsed_nested_table'
                                                                                                            style={{
                                                                                                                maxWidth: "100%",
                                                                                                                border: "1px solid black"
                                                                                                            }}
                                                                                                        >
                                                                                                            <div
                                                                                                                style={{
                                                                                                                    padding: "5px",
                                                                                                                    position: "relative",
                                                                                                                    minHeight: "37px",
                                                                                                                    overflowX: "scroll",
                                                                                                                    overflowY: "hidden"
                                                                                                                }}
                                                                                                            >
                                                                                                                {show_delete_button && (
                                                                                                                    <React.Fragment>
                                                                                                                        {" "}
                                                                                                                        <span
                                                                                                                            style={{textTransform: "capitalize"}}>
                                                                                                                            {element}
                                                                                                                        </span>{" "}
                                                                                                                        header{" "}
                                                                                                                    </React.Fragment>
                                                                                                                )}

                                                                                                                <Table
                                                                                                                    key={"collapse_table" + element + menu_index}
                                                                                                                    className={show_headers ? "" : "hide_headers_table"}
                                                                                                                >
                                                                                                                    <Table.Header>
                                                                                                                        <Table.Row>
                                                                                                                            <Table.HeaderCell
                                                                                                                                key={"table_header" + element + menu_index}
                                                                                                                            >
                                                                                                                                Header
                                                                                                                            </Table.HeaderCell>
                                                                                                                            {table_headers}
                                                                                                                        </Table.Row>
                                                                                                                    </Table.Header>
                                                                                                                    <Table.Body>
                                                                                                                        <Table.Row>
                                                                                                                            <Table.Cell
                                                                                                                                key={"table_header" + element + menu_index}>
                                                                                                                                <img
                                                                                                                                    onClick={() => {
                                                                                                                                        this.props.collapseField(
                                                                                                                                            element + "." + menu_index,
                                                                                                                                            true
                                                                                                                                        );
                                                                                                                                    }}
                                                                                                                                    src={uncollapse}
                                                                                                                                    style={{
                                                                                                                                        width: "30px",
                                                                                                                                        cursor: "pointer"
                                                                                                                                    }}
                                                                                                                                />
                                                                                                                            </Table.Cell>
                                                                                                                            {rows}
                                                                                                                        </Table.Row>
                                                                                                                    </Table.Body>
                                                                                                                </Table>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        <div
                                                                                                            style={{
                                                                                                                maxWidth: "100%",
                                                                                                                overflowX: "scroll",
                                                                                                                border: "1px solid black"
                                                                                                            }}
                                                                                                        >
                                                                                                            <div
                                                                                                                style={{
                                                                                                                    borderBottom: "1px solid black",
                                                                                                                    padding: "5px",
                                                                                                                    position: "relative",
                                                                                                                    height: "37px"
                                                                                                                }}
                                                                                                            >
                                                                                                                <span
                                                                                                                    className='left_collapse_button'>
                                                                                                                    <img
                                                                                                                        onClick={() => {
                                                                                                                            this.props.collapseField(element + "." + menu_index);
                                                                                                                        }}
                                                                                                                        src={collapse_img}
                                                                                                                        style={{width: "30px"}}
                                                                                                                    />
                                                                                                                </span>
                                                                                                                <span
                                                                                                                    style={{textTransform: "capitalize"}}>{element}</span>{" "}
                                                                                                                header
                                                                                                            </div>
                                                                                                            <div
                                                                                                                style={{padding: "10px"}}>{rows}</div>
                                                                                                            {show_table_buttons}
                                                                                                        </div>
                                                                                                    )}
                                                                                                    {tables}

                                                                                                    {show_delete_button && (
                                                                                                        <Button
                                                                                                            key={"delete_button" + element + index}
                                                                                                            color='red'
                                                                                                            style={{marginTop: "10px"}}
                                                                                                            onClick={() => this.deleteElement(element, menu_index)}
                                                                                                            data-qa='delete-element'
                                                                                                        >
                                                                                                            Delete
                                                                                                            Element
                                                                                                        </Button>
                                                                                                    )}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                        {!element_found && (
                                                                                            <div style={{
                                                                                                padding: "20px 10px",
                                                                                                fontSize: "15px"
                                                                                            }}>
                                                                                                No <span
                                                                                                style={{textTransform: "capitalize"}}>{element}</span> header
                                                                                                found
                                                                                            </div>
                                                                                        )}
                                                                                        {!block_adding && (
                                                                                            <Button
                                                                                                key={"add_new_element_button" + element}
                                                                                                onClick={() => this.props.addNewComplexData(element)}
                                                                                                data-qa='add-new-element'
                                                                                            >
                                                                                                Add new Element
                                                                                            </Button>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    }
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {this.props.visibleMenu.map((element, index) => {
                                                        if (this.state.complex_fields.includes(element)) {
                                                        }
                                                    })}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                </DoubleScrollbar>
                            </div>
                        </div>
                    </React.Fragment>
                )}
            </FileContext.Consumer>
        );
    }
}
