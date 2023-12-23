import React from "react";
import { Table, Button, Select, Popup, Icon } from "semantic-ui-react";
import "semantic-ui-css/semantic.min.css";
import _ from "lodash";
import ArrayRowEdit from "./ArrayRowEdit";
import DoubleScrollbar from "react-double-scrollbar";
import ResizableBox from "./../../../components/resizableBox/ResizableBox";
import ArrayRowFilter from "./ArrayRowFilter";
import TransformationModal from "./TransformationModal";
import validate from "../../../lib/validators";
import collapse from "../../../images/minus.png";
import SortableMultiSelect from "./SortableMultiSelect";

let uneditable_fields = {};
export default class ArrayRow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fieldNames: [],
            selected_field: null,
            selected_subfields: {},
            select_all_fields: {},
            colored_columns: [],
            new_records: [],
            deleted_fields: [],
            edited_fields: [],
            add_field_names: [],
            removed_field_names: [],
            sorting_field: [],
            sorting_order: [],
            selected_to_add_field: null,
            field_config: {},
            filters: {},
            data: [],
            sorted_data: [],
            sizes: { field: 55 },
            orig_sizes: null,
            grouped: false,
            group_data: {},
            auto_updated_fields: [],
            table_settings: { add: true, remove: true }
        };
        this.showEditView = this.showEditView.bind(this);
        this.addNewRecord = this.addNewRecord.bind(this);
        this.deleteArrayRecord = this.deleteArrayRecord.bind(this);
        this.setColoredColumn = this.setColoredColumn.bind(this);
        this.setNewArrayValue = this.setNewArrayValue.bind(this);
        this.unsetArrayValues = this.unsetArrayValues.bind(this);
        this.setColumnSize = this.setColumnSize.bind(this);
        this.sortRecords = this.sortRecords.bind(this);
        this.addFieldName = this.addFieldName.bind(this);
        this.removeFieldName = this.removeFieldName.bind(this);
        this.onFilter = this.onFilter.bind(this);
        this.setSortedData = this.setSortedData.bind(this);
        this.setFieldNamesList = this.setFieldNamesList.bind(this);
        this.moveHeader = this.moveHeader.bind(this);
        this.applyTransformation = this.applyTransformation.bind(this);
    }

    componentDidMount() {
        this.setFieldNamesList();
        if (this.props.config.TableSettings) {
            const setting = this.props.config.TableSettings.find((f) => f.name === this.props.fieldName);
            if (setting && Object.keys(setting).length === 3) {
                this.setState({ table_settings: setting });
            }
        }
        if (this.props.config.table_column_sizes && Array.isArray(this.props.config.table_column_sizes)) {
            let sizes = this.state.sizes;
            this.props.config.table_column_sizes
                .filter((k) => k.key.startsWith(this.props.fieldName + "."))
                .forEach((k) => {
                    sizes[k.key.split(".")[1]] = k.value;
                });
            this.setState({ sizes: sizes });
        }
        if (this.props.config.DefaultSortings && Array.isArray(this.props.config.DefaultSortings)) {
            let sort_item = this.props.config.DefaultSortings.find((k) => k.ArrayFieldName === "CurrentState." + this.props.fieldName);
            if (sort_item) {
                // sort_item = sort_item.SubFieldsToSort[0];
                // console.log(sort_item);
                // const sorting_field = sort_item.SubField;
                // const sorting_order = sort_item.Order == 'ascending' ? 1 : -1;
                this.setState(
                    {
                        sorting_field: sort_item.SubFieldsToSort.map((item) => item.SubField),
                        sorting_order: sort_item.SubFieldsToSort.map((item) => (item.Order == "ascending" ? 1 : -1))
                    },
                    () => {
                        this.setSortedData();
                    }
                );
            }
        }
        const manual_exceptions_list = this.props.config.updates_manual_overwrite_fields ? this.props.config.updates_manual_overwrite_fields : [];
        const auto_updated_fields = this.props.config.update_logics
            ? this.props.config.update_logics.map((logics) => logics.updated_field).filter((f) => !manual_exceptions_list.includes(f))
            : [];
        this.setState({ auto_updated_fields: auto_updated_fields });

        if (this.props.changedValues[this.props.element_key]) {
            let new_records = [];
            Object.keys(this.props.changedValues[this.props.element_key]).forEach((key) => {
                if (key.length === 11) {
                    let new_record = {};
                    Object.keys(this.props.changedValues[this.props.element_key][key]).forEach((subKey) => {
                        const t = this.props.changedValues[this.props.element_key][key][subKey];
                        if (t.valid === false && t.value !== undefined) new_record[subKey] = t.value;
                        else new_record[subKey] = "";
                    });
                    new_record["_id"] = key;
                    new_records.push(new_record);
                }
            });
            if (new_records.length > 0) this.setState({ new_records: new_records });
        } else {
            this.setState({ new_records: [] });
        }
    }

    setFieldNamesList() {
        // if (this.state.orig_sizes && this.props.tableColumns) return;
        let field_config = this.props.config.DefaultFieldsToDisplayInAuditSession.find((f) => {
            return f["name"] && f["name"] === this.props.fieldName;
        });
        if (this.props.complexField) {
            const f = this.props.config.DefaultFieldsToDisplayInAuditSession.find((f) => {
                return f["name"] && f["name"] === this.props.fieldName.split(".")[0];
            });
            if (f && f.nested_fields) field_config = f.nested_fields.find((f1) => f1.name === this.props.fieldName.split(".")[1]);
        } else {
            if (!field_config && this.props.config.OriginalDefaultFieldsToDisplayInAuditSession) {
                field_config = this.props.config.OriginalDefaultFieldsToDisplayInAuditSession.find((f) => {
                    return f["name"] && f["name"] === this.props.fieldName;
                });
            }
            if (!field_config && window.object_schema) {
                const s = "CurrentState." + this.props.fieldName + ".[].";
                const subFields = window.object_schema.fields
                    .filter((f) => f.name.startsWith(s))
                    .map((f) => f.name.replace(s, ""))
                    .filter((f) => f != "_id");
                if (subFields.length > 0) {
                    field_config = {
                        AllSubDocumentFields: subFields,
                        DefaultFieldsToDisplayInAuditSession: subFields,
                        name: this.props.fieldName
                    };
                }
            }
        }

        if (!field_config || !this.props.data) return;
        let fieldNames =
            field_config && field_config["DefaultFieldsToDisplayInAuditSession"]
                ? field_config["DefaultFieldsToDisplayInAuditSession"]
                : this.props.data[0]
                ? Object.keys(this.props.data[0])
                : [];
        const UnDisplayableFields = this.props.config.UnDisplayableFields || [];
        if (fieldNames.length > 0) fieldNames = fieldNames.filter((item) => item !== "_id" && !UnDisplayableFields.includes(this.props.fieldName + "." + item));
        if (this.props.tableColumns && this.props.tableColumns.join(".") !== fieldNames.join(".")) fieldNames = this.props.tableColumns;
        let allFieldsList = this.props.data[0] ? Object.keys(this.props.data[0]) : [];
        this.props.data.forEach((el) => {
            const keys = Object.keys(el);
            if (keys.length > allFieldsList.length) allFieldsList = keys;
        });
        if (field_config["AllSubDocumentFields"]) allFieldsList = allFieldsList.concat(field_config["AllSubDocumentFields"]);
        field_config["AllSubDocumentFields"] = [...new Set(allFieldsList.concat(field_config["DefaultFieldsToDisplayInAuditSession"]))].filter((item) => item !== "_id");
        if (
            fieldNames.length !== this.state.fieldNames.length ||
            Object.keys(this.state.field_config).length === 0 ||
            field_config["AllSubDocumentFields"].length !== this.state.field_config["AllSubDocumentFields"].length
        ) {
            let sizes = this.state.sizes;
            for (var key in fieldNames) if (!sizes[fieldNames[key]]) sizes[fieldNames[key]] = fieldNames[key].length * 7 + 35;
            fieldNames.forEach((key) => {
                if (
                    (this.props.config.UnEditableFields && this.props.config.UnEditableFields.includes(this.props.fieldName + "." + key)) ||
                    this.state.auto_updated_fields.includes(this.props.fieldName + "." + key)
                )
                    uneditable_fields[key] = true;
            });
            this.setState({ fieldNames: fieldNames, sizes: sizes, field_config: field_config, data: this.props.data }, () => {
                this.setSortedData();
            });

            if (!this.state.orig_sizes) this.setState({ orig_sizes: Object.assign({}, sizes) });
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.previousAudit !== this.props.previousAudit) {
            this.props.chart_context.setSelectedArrayField(null);

            let data = this.props.data;
            if (data && Object.keys(this.state.filters).length > 0) {
                let filters = this.state.filters;
                let filtered = data;
                Object.keys(filters).map((key) => {
                    data = data.filter((item) => this.filterHandler(filters, item, key));
                    return key;
                });
            }
            this.setState({ selected_field: null, new_records: [], edited_fields: [], data, grouped: false, group_data: {}, select_all_fields: {}, selected_subfields: {} }, () => {
                this.setSortedData();
            });
        }
        if (prevProps.changedValues !== this.props.changedValues) {
            let new_records = Object.keys(this.props.changedValues).length > 0 ? this.state.new_records.slice(0) : [];
            new_records.forEach((r, index) => {
                if (this.props.changedValues[this.props.element_key]) {
                    const changed = this.props.changedValues[this.props.element_key][r["_id"]];
                    if (changed) {
                        Object.keys(changed).forEach((key) => {
                            new_records[index][key] = changed[key]["value"];
                        });
                    }
                }
            });
            this.setState({ new_records: new_records }, () => {
                this.setSortedData();
            });
        }
        // if (this.props.tableColumns && this.props.tableColumns.join(".") !== this.state.fieldNames.join(".")) this.setState({ fieldNames: this.props.tableColumns });
        this.setFieldNamesList();
        if (prevProps.errors !== this.props.errors) {
            const error_key = Object.keys(this.props.errors).find((k) => k.startsWith(this.props.element_key));
            if (error_key) {
                const ar = error_key.split(".");
                if (ar.length === 5) {
                    this.setState({ selected_field: ar.pop() });
                }
            }
        }
    }

    showEditView(field_id) {
        const width = this.state.selected_field === field_id ? 36 : 65;
        let sizes = this.state.sizes;
        sizes["field"] = width;
        this.setState({ selected_field: this.state.selected_field === field_id ? null : field_id, sizes: sizes });
    }

    addNewRecord() {
        let new_record = {};
        let new_record_validate = {};
        this.state.fieldNames.forEach((fieldName) => {
            new_record[fieldName] = "";
            if (!this.props.config.UnEditableFields.includes(this.props.fieldName + "." + fieldName)) new_record_validate[fieldName] = "";
        });
        new_record["_id"] = Math.random().toString(36).slice(2);
        if (new_record["_id"].length === 10) new_record["_id"] += "1";
        let new_records = this.state.new_records;
        new_records.push(new_record);
        this.setState({ new_records: new_records });
        //new_record['value']={};
        this.props.addNewArrayRecord(this.props.element_key, { _id: new_record["_id"], value: new_record_validate });
        this.showEditView(new_record["_id"]);
    }

    deleteArrayRecord(e, id, isNewRecord, restore = false) {
        e.preventDefault();
        e.stopPropagation();
        if (restore) {
            this.props.setNewArrayValue(this.props.element_key, id, "deleted", false, false);
            let deleted_fields = this.state.deleted_fields;
            deleted_fields = deleted_fields.filter((t) => t !== id);
            this.setState({ deleted_fields: deleted_fields, selected_field: null });
            return;
        }
        if (!isNewRecord) {
            this.props.setNewArrayValue(this.props.element_key, id, "deleted", 1, false);
            let deleted_fields = this.state.deleted_fields;
            deleted_fields.push(id);
            this.setState({ deleted_fields: deleted_fields, selected_field: null });
            this.forceUpdate();
        } else {
            let new_records = this.state.new_records;
            new_records = new_records.filter((r) => r["_id"] !== id);
            this.setState({ new_records: new_records, selected_field: null });
            this.props.setNewArrayValue(this.props.element_key, id, "deleted", 1, false);
        }
    }

    setNewArrayValue(fieldName, id, subfieldName, value, valid, apply_all = false, comment = false) {
        let edited_fields = this.state.edited_fields;
        if (apply_all) {
            this.state.data.forEach((row) => {
                const row_id = row["_id"];
                if (value && !edited_fields.includes(row_id)) {
                    edited_fields.push(row_id);
                    this.setState({ edited_fields: edited_fields });
                }
                this.props.setNewArrayValue(fieldName, row_id, subfieldName, value, valid, comment);
            });
            return;
        }
        if (value && !edited_fields.includes(id)) {
            edited_fields.push(id);
            this.setState({ edited_fields: edited_fields });
        }
        this.props.setNewArrayValue(fieldName, id, subfieldName, value, valid);
    }

    unsetArrayValues(fieldName, id, subfieldName, value) {
        this.state.data.forEach((row) => {
            const row_id = row["_id"];
            if (row_id !== id) {
                this.props.unsetArrayValue(fieldName, row["_id"], subfieldName, value);
                this.forceUpdate();
            }
        });
    }

    setSorting(sorting_field, e) {
        if (this.state.grouped || e.target.className === "react-resizable-handle react-resizable-handle-se" || e.target.className.includes("icon")) return;
        let sort_fields = this.state.sorting_field;
        let sort_orders = this.state.sorting_order;
        const i = sort_fields.findIndex((f) => f === sorting_field);
        let order = 1;
        if (i >= 0) {
            sort_fields.splice(i, 1);
            order = 0 - sort_orders[i];
            sort_orders.splice(i, 1);
        }
        sort_fields = [sorting_field].concat(sort_fields);
        sort_orders = [order].concat(sort_orders);
        this.setState({ sorting_field: sort_fields, sorting_order: sort_orders }, () => {
            this.setSortedData();
        });
    }

    sortRecords(records) {
        if (!this.state.grouped && this.state.sorting_field) {
            const sorting_fields = this.state.sorting_field;
            const sorting_orders = this.state.sorting_order;
            records = _.orderBy(
                records,
                sorting_fields.map(
                    (sorting_field) =>
                        function (item) {
                            let value = item[sorting_field];
                            if (typeof value == "string") value = value.toLowerCase();
                            if (value === "inf") value = Infinity;
                            if (value === "-inf") value = -Infinity;
                            return value;
                        }
                ),
                sorting_orders.map((o) => (o === 1 ? "asc" : "desc"))
            );
            return records;
        }
        return records;
    }

    prepareData(n, name, shorten = true) {
        if (Array.isArray(n)) {
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
                    style={{ color: "#014996" }}
                    target={"_blank"}
                >
                    {n}
                </a>
            );
        if (shorten && Number(n) === n && n % 1 !== 0) {
            if (this.props.config.FloatDisplayPrecision) {
                const option = this.props.config.FloatDisplayPrecision.find((t) => t.name === name);
                if (option) return n.toFixed(option.value);
            }
            return n.toFixed(4).toString();
        }
        if (n === true) return "True";
        if (n === false) return "False";
        return n || n === 0 ? n.toString() : "";
    }

    setColumnSize(item, width) {
        if (width === -1) {
            this.setState({ sizes: this.state.orig_sizes });
            return;
        }
        let sizes = this.state.sizes;
        sizes[item] = width;
        this.setState({ sizes: sizes });
        this.props.setTableColumnSize(this.props.fieldName + "." + item, width);
        this.forceUpdate();
    }

    isSelectedOnChart(item, context) {
        if (context && context.selectedArrayField && context.selectedArrayField["field"] === this.props.fieldName && context.selectedArrayField["id"] === item["_id"]) {
            return true;
        }
        return false;
    }

    setColoredColumn(item, e = false) {
        if (e) e.preventDefault();
        let columns = this.state.colored_columns;
        if (columns.includes(item)) {
            const index = columns.indexOf(item);
            columns.splice(index, 1);
            if (this.state.grouped === item)
                this.setState({ grouped: false, group_data: {} }, () => {
                    this.setSortedData();
                });
        } else {
            columns.push(item);
            this.setState({ grouped: item }, () => {
                this.setSortedData();
            });
        }
        this.setState({ colored_columns: columns });
    }

    setSortedData() {
        let data = this.sortRecords(this.state.data.concat(this.state.new_records));

        if (this.state.grouped && this.props.config.ColumnCalculations) {
            const subTotal = this.props.config.ColumnCalculations.find((t) => t.table === this.props.fieldName && t.field === this.state.grouped);
            if (subTotal) {
                const t = _.cloneDeep(data);
                var gr = _.groupBy(t, function (n) {
                    return n[subTotal.group];
                });
                let new_data = [];
                let group_data = {};
                let changedValues = this.props.changedValues[this.props.element_key];
                Object.keys(gr).forEach((group_key) => {
                    new_data = new_data.concat(gr[group_key]);
                    let new_element = _.cloneDeep(new_data[new_data.length - 1]);
                    Object.keys(new_element).forEach((key) => {
                        if (key === subTotal.field) {
                            new_element[key] =
                                _.reduce(
                                    _.cloneDeep(gr[group_key]),
                                    function (sum, n) {
                                        var s = parseInt(n[key]);
                                        const changed = changedValues && changedValues[n["_id"]];
                                        if (changed && changed.deleted && changed.deleted.value) return sum;
                                        if (changed && changedValues[n["_id"]][key]) s = parseInt(changedValues[n["_id"]][key]["value"]);
                                        return sum + (isNaN(s) ? 0 : s);
                                    },
                                    0
                                ) + " Total";
                        } else {
                            new_element[key] = null;
                        }
                    });
                    group_data[new_data.length] = new_element;
                    //new_data.push(new_element);
                });
                if (!window.sorted_data) window.sorted_data = {};
                window.sorted_data[this.props.element_key] = new_data;
                this.setState({ group_data: group_data, sorted_data: new_data });
                if (!window.sorted_data) window.sorted_data = {};
                window.sorted_data[this.props.element_key] = new_data;
                return;
            }
        }
        if (!window.sorted_data) window.sorted_data = {};
        window.sorted_data[this.props.element_key] = data;
        this.setState({ sorted_data: data });
    }

    addFieldName(fieldName) {
        if (!fieldName) return;
        let fieldNames = this.state.fieldNames;
        if (!fieldNames.includes(fieldName)) fieldNames.push(fieldName);
        let sizes = this.state.sizes;
        if (!sizes[fieldName]) sizes[fieldName] = fieldName.length * 7 + 30;
        fieldNames.forEach((key) => {
            if (this.props.config.UnEditableFields.includes(this.props.fieldName + "." + key) || this.state.auto_updated_fields.includes(this.props.fieldName + "." + key))
                uneditable_fields[key] = true;
        });
        this.setState({ selected_to_add_field: null, fieldNames: fieldNames, sizes: sizes, data: this.props.data }, () => {
            this.setSortedData();
        });
        this.props.setTableColumn(this.props.fieldName, fieldNames);
    }

    removeFieldName(fieldName) {
        let fieldNames = this.state.fieldNames;
        if (fieldNames.includes(fieldName)) fieldNames = fieldNames.filter((f) => f !== fieldName);
        fieldNames.forEach((key) => {
            if (this.props.config.UnEditableFields.includes(this.props.fieldName + "." + key) || this.state.auto_updated_fields.includes(this.props.fieldName + "." + key))
                uneditable_fields[key] = true;
        });
        this.setState({ fieldNames: fieldNames }, () => {
            this.props.setTableColumn(this.props.fieldName, fieldNames);
        });
    }

    filterHandler(filters, item, key) {
        let result = false;
        let value = item[key] !== undefined && item[key] !== null ? item[key].toString() : null;
        if (filters[key] === "---" || filters[key] === "null") {
            return value === null;
        }
        if (typeof value === "string") {
            result = value.toLowerCase().indexOf(filters[key].toLowerCase()) >= 0;
        }
        if (typeof value === "number") {
            value = value.toString();
            result = value.indexOf(filters[key]) >= 0;
        }
        return result;
    }

    onFilter(ev, fieldName) {
        const data = this.props.data;
        let filters = this.state.filters;
        let filtered = data;
        if (ev.target.value) {
            filters[fieldName] = ev.target.value;
        } else if (fieldName in filters) {
            delete filters[fieldName];
        }
        Object.keys(filters).map((key) => {
            filtered = filtered.filter((item) => this.filterHandler(filters, item, key));
            return key;
        });
        if (Object.keys(filters).length === 0) {
            filtered = data;
        }
        this.setState({ data: filtered, filters: filters }, () => {
            this.setSortedData();
        });
    }

    setSelectedSubfield(field, id) {
        let state = this.state.selected_subfields;
        if (!state[id]) state[id] = {};
        if (!state[id][this.props.fieldName]) state[id][this.props.fieldName] = {};
        state[id][this.props.fieldName][field] = true;
        this.setState({ selected_subfields: state });
    }

    setSelectedAllField(field, id, value) {
        let state = this.state.select_all_fields;
        if (!state[id]) state[id] = {};
        if (value) state[id][field] = value;
        else {
            if (state[id][field]) delete state[id][field];
        }
        this.setState({ select_all_fields: state });
    }

    applyTransformation(fieldName, code, comment) {
        if (fieldName === "") {
            alert("Select a field");
            return;
        }
        if (code === "") {
            alert("Enter a function code");
            return;
        }
        try {
            if (!code.includes("return ")) {
                code = `{return ${code};}`;
            }
            let convert_to_int = false;
            var validator = this.props.config.Validators.find((v) => v.name === this.props.fieldName + "." + fieldName);
            if (validator && validator.type === "numeric") convert_to_int = true;
            var f = new Function(
                ["x", "this_field"].concat(Object.keys(this.state.data[0]).map((k) => k.replace(/\s/g, "_").replace(/\//g, ""))),
                code.split("this[").join("this_field[")
            );
            if (this.state.data[0][fieldName] && f(this.state.data[0][fieldName], this.state.data[0]) === undefined) {
                return "Your function is incorrect";
            }
            let changedValues = this.props.changedValues;
            let values = [];
            let error = false;
            const old_values = JSON.parse(JSON.stringify(changedValues));
            this.state.data.forEach((row) => {
                const row_id = row["_id"];
                if (row[fieldName] !== undefined) {
                    const value = convert_to_int ? parseFloat(row[fieldName]) : row[fieldName];
                    const args = [value, row, ...Object.values(row)];
                    let new_value = f(...args);
                    if (!Number.isNaN(new_value)) new_value = new_value.toString();
                    changedValues = this.props.setNewArrayValue(this.props.element_key, row_id, fieldName, new_value, false, comment, changedValues);
                }
            });
            const errors = validate(this.props.config, changedValues);
            if (Object.keys(errors).length > 0) {
                this.props.setChangedValues(old_values);
                const key = Object.keys(errors)[0];
                return key + " " + errors[key];
            }
            return false;
        } catch (error) {
            return error.toString();
        }
    }

    moveHeader(index, dir) {
        const fields = this.state.fieldNames.slice(0);
        const f = fields[index];
        fields[index] = fields[index + dir];
        fields[index + dir] = f;
        this.setState({ fieldNames: fields }, () => {
            this.props.setTableColumn(this.props.fieldName, fields);
        });
    }

    render() {
        const fieldName = this.props.fieldName;
        const field_complex_key = this.props.element_key;
        const unDisplayableFields = this.props.config.UnDisplayableFields;
        let add_fields_list = [];
        if (this.state.field_config["AllSubDocumentFields"]) {
            add_fields_list = this.state.field_config["AllSubDocumentFields"].filter((f) => !this.state.fieldNames.includes(f));
        } else {
            if (this.props.schema) {
                const n = "CurrentState." + fieldName + ".[].";
                add_fields_list = this.props.schema.fields.filter((f) => f.name.startsWith(n)).map((f) => f.name.replace(n, ""));
            }
        }
        add_fields_list = add_fields_list.filter((f) => !unDisplayableFields.includes(fieldName + "." + f));
        const context = this.props.chart_context;
        const l = this.state.fieldNames.length;
        let added_rows = [];
        if (this.props.sessions) {
            this.props.sessions.forEach((session) => {
                session.AuditValueArray.filter((ar) => ar.AuditFieldName === this.props.fieldName)
                    .filter((ar) => ar.NewValue && ar.NewValue["_id"])
                    .forEach((auditArray) => {
                        added_rows.push(auditArray.NewValue["_id"]);
                    });
            });
        }

        return (
            <div className={"detail_table_array" + (this.props.complexField ? " nested_table_array" : "")}>
                <div data-qa={fieldName} className='array_field_title'>
                    {fieldName}
                </div>
                <span className='array_row_add_field'>
                    {add_fields_list.length > 0 && (
                        <React.Fragment>
                            <SortableMultiSelect
                                data-qa='add-field'
                                placeholder='Select field'
                                containerClass='.splitter-layout'
                                className='array_row_add_field_selector'
                                styles={{
                                    menu: (base) => ({
                                        ...base,
                                        width: "300px",
                                        left: "-100px"
                                    })
                                }}
                                options={add_fields_list.map((f) => {
                                    return { key: f, value: f, label: f };
                                })}
                                value={{ key: this.state.selected_to_add_field, value: this.state.selected_to_add_field, label: this.state.selected_to_add_field }}
                                menuPlacement={this.props.upward ? "top" : "bottom"}
                                isMulti={false}
                                onChange={(value, m) => {
                                    if (value) this.setState({ selected_to_add_field: value.key });
                                }}
                            />
                            <Button data-qa='add-field-btn' onClick={() => this.addFieldName(this.state.selected_to_add_field)}>
                                Add field
                            </Button>
                        </React.Fragment>
                    )}
                </span>
                <span className='left_collapse_button2'>
                    <img onClick={this.props.collapseField} src={collapse} style={{ width: "30px" }} />
                </span>

                <DoubleScrollbar>
                    <Table striped sortable celled fixed style={{ maxWidth: "100%" }} className='detail_table detail_table_array' name={this.props.fieldName}>
                        <Table.Header fullWidth={true}>
                            <Table.Row className='subdocument_header'>
                                <Table.HeaderCell style={{ position: "relative", width: this.state.sizes["field"] + "px" }} key={fieldName + "header"}></Table.HeaderCell>
                                {this.state.fieldNames.map((field, index) => {
                                    const sort_index = this.state.sorting_field.findIndex((f) => f === field);
                                    const class_name = sort_index >= 0 ? (this.state.sorting_order[sort_index] > 0 ? "ascending" : "descending") + " sorted" : "";
                                    let width = this.state.sizes[field];
                                    const colored = this.state.colored_columns.includes(field);
                                    if (width < 80) width = 80;
                                    return (
                                        <Table.HeaderCell
                                            style={{ position: "relative", width: width + "px" }}
                                            className={class_name + (colored ? " yellow" : "")}
                                            onClick={(e) => this.setSorting(field, e)}
                                            onContextMenu={(e) => this.setColoredColumn(field, e)}
                                            key={fieldName + "header" + index}
                                            data-qa={field}
                                        >
                                            {index > 0 && (
                                                <Icon
                                                    name='angle left'
                                                    className='table_header_move'
                                                    onClick={() => {
                                                        this.moveHeader(index, -1);
                                                    }}
                                                />
                                            )}
                                            <ResizableBox
                                                width={width}
                                                className='box'
                                                axis='x'
                                                minConstraints={[70, 20]}
                                                maxConstraints={[700, 500]}
                                                onResize={(e, data) => {
                                                    this.setColumnSize(field, data.size.width);
                                                }}
                                            >
                                                <div className={"remove_field_button"} style={{ paddingLeft: "0px" }}>
                                                    <Icon name='remove circle' onClick={() => this.removeFieldName(field)} />
                                                </div>
                                                <span data-qa={field} className='array_table_header_text'>
                                                    {field}
                                                </span>
                                            </ResizableBox>
                                            {index < l - 1 && (
                                                <Icon
                                                    name='angle right'
                                                    className='table_header_move'
                                                    onClick={() => {
                                                        this.moveHeader(index, 1);
                                                    }}
                                                />
                                            )}
                                        </Table.HeaderCell>
                                    );
                                })}
                            </Table.Row>
                        </Table.Header>
                        <tbody
                        /*ref={this.props.ref_prop}  {...this.props.drag_provided.draggableProps} {...this.props.drag_provided.dragHandleProps}*/
                        >
                            {(this.state.data.length > 3 || Object.keys(this.state.filters).length > 0) && (
                                <Table.Row>
                                    <ArrayRowFilter fieldNames={this.state.fieldNames} mainFieldName={this.props.fieldName} onFilter={this.onFilter} filters={this.state.filters} />
                                </Table.Row>
                            )}
                            {this.state.sorted_data.map((item, index) => {
                                const deleted = this.state.deleted_fields.includes(item["_id"]);
                                const selected = this.state.selected_field && this.state.selected_field === item["_id"];
                                const edited_field = this.state.edited_fields.includes(item["_id"]);
                                let changedValues = this.props.changedValues[this.props.element_key];
                                const update_all_cells = this.state.select_all_fields[item["_id"]];
                                let group_row = null;
                                const is_new_row = this.state.data.findIndex((r) => r["_id"] === item["_id"]);
                                if (this.state.group_data[index + 1]) {
                                    group_row = (
                                        <Table.Row id={fieldName + item["_id"] + " grouped"}>
                                            <Table.Cell style={{ width: "auto" }}></Table.Cell>
                                            {this.state.fieldNames
                                                .filter((item2) => item2 !== "_id")
                                                .map((key) => {
                                                    let value = this.state.group_data[index + 1][key];
                                                    let updated = false;
                                                    if (this.props.changedValues)
                                                        return (
                                                            <Popup
                                                                content={
                                                                    <div>
                                                                        <p>{this.prepareData(value, false)} </p>
                                                                    </div>
                                                                }
                                                                key={"array_row" + key + " grouped"}
                                                                pinned
                                                                position={"top right"}
                                                                trigger={
                                                                    <Table.Cell style={{ margin: "10px", cursor: "pointer" }} key={fieldName + index + key}>
                                                                        {value}
                                                                    </Table.Cell>
                                                                }
                                                            />
                                                        );
                                                })}
                                        </Table.Row>
                                    );
                                }
                                if (changedValues) changedValues = changedValues[item["_id"]] ? changedValues[item["_id"]] : null;
                                // const previouslyEdited = Object.keys(this.props.previousAudit).filter(k=>k.startsWith(fieldName+"."+item['_id'])).length>0;
                                return (
                                    <React.Fragment key={fieldName + index}>
                                        {!selected ? (
                                            <Table.Row
                                                id={fieldName + item["_id"]}
                                                onClick={() => {
                                                    this.showEditView(item["_id"]);
                                                    context.setSelectedArrayField({ id: item["_id"], field: fieldName });
                                                }}
                                                key={fieldName + item["_id"]}
                                                className={deleted ? "deleted_array_field" : this.isSelectedOnChart(item, context) ? "chart_selected_point " : ""}
                                            >
                                                <Table.Cell style={{ width: "auto" }}>
                                                    {this.state.table_settings.remove && (
                                                        <Icon
                                                            style={{ margin: "10px 6px", cursor: "pointer" }}
                                                            name='remove circle'
                                                            onClick={(e) => {
                                                                this.deleteArrayRecord(e, item["_id"], false, deleted);
                                                                context.setSelectedArrayField(null);
                                                            }}
                                                        />
                                                    )}
                                                </Table.Cell>
                                                {this.state.fieldNames
                                                    .filter((item2) => item2 !== "_id")
                                                    .map((key) => {
                                                        const audit_key = this.props.complexField
                                                            ? this.props.element_key.replace(".index", ".") + "." + item["_id"] + "." + key
                                                            : this.props.fieldName + "." + item["_id"] + "." + key;
                                                        const previoslyEdited = this.props.previousAudit[audit_key] || added_rows.includes(item["_id"]);
                                                        let value = item[key];
                                                        let updated = false;
                                                        if (changedValues && changedValues[key]) {
                                                            if (!changedValues[key]["valid"]) value = changedValues[key]["value"];
                                                            updated = true;
                                                        }
                                                        const colored = this.state.colored_columns.includes(key);
                                                        let className = colored ? "yellow " : " ";
                                                        className += updated ? "updated_array_cell" : previoslyEdited ? "prev_edited" : "";
                                                        className += update_all_cells && update_all_cells[key] ? " update_all_cell" : "";
                                                        className += uneditable_fields[key] ? " uneditable" : "";
                                                        if (this.props.changedValues)
                                                            return (
                                                                <React.Fragment key={this.props.fieldName + "." + item["_id"] + key}>
                                                                    <Popup
                                                                        content={
                                                                            <div>
                                                                                <p>{this.prepareData(value, false)} </p>
                                                                            </div>
                                                                        }
                                                                        key={"array_row" + key}
                                                                        pinned
                                                                        position={"top right"}
                                                                        trigger={
                                                                            <Table.Cell
                                                                                className={className}
                                                                                style={{ margin: "10px", cursor: "pointer" }}
                                                                                onContextMenu={(e) => this.setColoredColumn(key, e)}
                                                                                key={fieldName + index + key}
                                                                                name={key}
                                                                            >
                                                                                <React.Fragment>
                                                                                    <span>{this.prepareData(value, fieldName + "." + key) || ""}</span>
                                                                                    <div
                                                                                        id={(
                                                                                            this.props.element_key.replace(/\./g, "_") +
                                                                                            "_" +
                                                                                            item["_id"] +
                                                                                            "_" +
                                                                                            key +
                                                                                            "_value"
                                                                                        ).replace(/\s/g, "")}
                                                                                        style={{ display: "none" }}
                                                                                    >
                                                                                        {(value || (value === 0 ? 0 : "")).toString()}
                                                                                    </div>
                                                                                </React.Fragment>
                                                                            </Table.Cell>
                                                                        }
                                                                    />
                                                                </React.Fragment>
                                                            );
                                                    })}
                                            </Table.Row>
                                        ) : (
                                            <ArrayRowEdit
                                                data={item}
                                                complexField={this.props.complexField}
                                                hideView={() => {
                                                    this.showEditView(item["_id"]);
                                                    if (this.state.selected_field === item["_id"]) context.setSelectedArrayField(null);
                                                }}
                                                config={this.props.config}
                                                new_record={is_new_row < 0}
                                                changedValues={this.props.changedValues}
                                                errors={this.props.errors}
                                                setNewValue={this.props.setNewValue}
                                                auto_updated_fields={this.state.auto_updated_fields}
                                                uneditable_fields={uneditable_fields}
                                                fieldNames={this.state.fieldNames}
                                                setNewArrayValue={this.setNewArrayValue}
                                                unsetArrayValues={this.unsetArrayValues}
                                                previousAudit={this.props.previousAudit}
                                                setArrayComment={this.props.setArrayComment}
                                                setValidity={this.props.setArrayValueValidity}
                                                fieldName={this.props.fieldName}
                                                element_key={this.props.element_key}
                                                selected_subfields={this.state.selected_subfields}
                                                select_all_fields={this.state.select_all_fields}
                                                resize={(field, width) => {
                                                    this.setColumnSize(field, width);
                                                }}
                                                setSelectedSubField={this.setSelectedSubfield.bind(this)}
                                                setSelectedAllField={this.setSelectedAllField.bind(this)}
                                                validity={
                                                    this.props.validity[field_complex_key] && this.props.validity[field_complex_key][item["_id"]]
                                                        ? this.props.validity[field_complex_key][item["_id"]]
                                                        : null
                                                }
                                            />
                                        )}
                                        {group_row}
                                    </React.Fragment>
                                );
                            })}

                            {this.state.new_records &&
                                false &&
                                this.state.new_records.map((item, index) => (
                                    <React.Fragment key={this.props.fieldName + index}>
                                        {this.state.selected_field && this.state.selected_field === item["_id"] ? (
                                            <ArrayRowEdit
                                                data={item}
                                                complexField={this.props.complexField}
                                                hideView={() => this.showEditView(item["_id"])}
                                                new_record={true}
                                                config={this.props.config}
                                                changedValues={this.props.changedValues}
                                                fieldNames={this.state.fieldNames}
                                                uneditable_fields={uneditable_fields}
                                                auto_updated_fields={this.state.auto_updated_fields}
                                                errors={this.props.errors}
                                                setNewValue={this.props.setNewValue}
                                                setNewArrayValue={this.props.setNewArrayValue}
                                                unsetArrayValues={this.unsetArrayValue}
                                                previousAudit={this.props.previousAudit}
                                                setArrayComment={this.props.setArrayComment}
                                                setValidity={this.props.setArrayValueValidity}
                                                fieldName={this.props.fieldName}
                                                element_key={this.props.element_key}
                                                selected_subfields={this.state.selected_subfields}
                                                select_all_fields={this.state.select_all_fields}
                                                resize={(field, width) => {
                                                    this.setColumnSize(field, width);
                                                }}
                                                setSelectedSubField={this.setSelectedSubfield.bind(this)}
                                                setSelectedAllField={this.setSelectedAllField.bind(this)}
                                                validity={
                                                    this.props.validity[field_complex_key] && this.props.validity[field_complex_key][item["_id"]]
                                                        ? this.props.validity[field_complex_key][item["_id"]]
                                                        : null
                                                }
                                            />
                                        ) : (
                                            <Table.Row
                                                className='just_added_array_field'
                                                onClick={() => {
                                                    this.showEditView(item["_id"]);
                                                }}
                                            >
                                                <Table.Cell style={{ width: "130px" }}>
                                                    <Icon
                                                        style={{ margin: "10px", cursor: "pointer" }}
                                                        name='remove circle'
                                                        onClick={(e) => this.deleteArrayRecord(e, item["_id"], true)}
                                                    />
                                                </Table.Cell>
                                                {Object.keys(item)
                                                    .filter((item2) => item2 !== "_id")
                                                    .map((key) => (
                                                        <Table.Cell style={{ margin: "10px", cursor: "pointer" }} key={this.props.fieldName + index + key}>
                                                            {item[key]}
                                                        </Table.Cell>
                                                    ))}
                                            </Table.Row>
                                        )}
                                    </React.Fragment>
                                ))}
                            <Table.Row></Table.Row>
                        </tbody>
                    </Table>
                </DoubleScrollbar>
                <div style={{ height: "60px" }}>
                    <Button
                        data-qa='hide-table'
                        className='array_row_add_button'
                        onClick={this.props.removeField}
                        style={{ margin: "15px", float: "left", position: "relative", left: 0 }}
                    >
                        Hide Table
                    </Button>
                    {this.state.table_settings.add && (
                        <Button data-qa='add-record' className='array_row_add_button' onClick={this.addNewRecord} style={{ margin: "15px" }}>
                            Add Row
                        </Button>
                    )}

                    {this.props.config.user_functions && this.props.config.user_functions.on && (
                        <TransformationModal
                            applyTransformation={this.applyTransformation}
                            fields={this.state.fieldNames}
                            functions={this.props.config.user_functions.admin_approved_functions.filter((f) => f.updated_field.includes(fieldName + "."))}
                            allow_create={this.props.config.user_functions.allow_user_to_edit_function}
                            fieldName={this.props.fieldName}
                            collectionName={this.props.config.CollectionRelevantFor}
                            config={this.props.config}
                        />
                    )}
                </div>
            </div>
        );
    }
}
