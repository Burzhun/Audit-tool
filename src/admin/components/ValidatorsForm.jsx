import React, { useState, useEffect } from "react";
import { Grid, TextArea, Radio, Segment, SegmentGroup, Input, Button, Select, Popup, Table } from "semantic-ui-react";
import JsonForm from "./jsonForm";
import SortableMultiSelect from "./SortableMultiSelect";
import CreatableSelect from "react-select/creatable";

let fields = [];
let empty_fields = [];
let only_validatior_fields = [];
let repeating_fields = [];
let empty_validators = [];
let global_updates = null;
let field_scheme_values = {};
let table_fields = [];

const ValidationForm = (props) => {
    const [formType, setFormType] = useState("html");
    const [selectedField, setSelectedField] = useState("");
    const [filterField, setFilterField] = useState("");
    const [newfieldName, setNewFieldName] = useState("");
    const [selectedCollection, setSelectedCollection] = useState(null);
    const [constraints, setConstraints] = useState([]);
    const [existingFields, setExistingFields] = useState([]);
    const [unfilteredExistingFields, setUnfilterdExistingFields] = useState([]);

    const dataTypes = ["bool", "numeric", "text", "enumerate", "isodate", "url", "enumerate_array", "text_array", "numeric_array", "external_user_email"];

    useEffect(() => {
        setSelectedField("");
        setExistingFields([]);
        setUnfilterdExistingFields([]);
        setNewFieldName("");
        if (selectedCollection && selectedCollection.constraints) {
            setConstraints(
                Object.keys(selectedCollection.constraints)
                    .sort()
                    .map((key) => {
                        return { key: key, value: selectedCollection.constraints[key] };
                    })
            );
        }
        setFieldsList();
    }, [props.collection]);

    useEffect(() => {
        setFieldsList();
    }, [filterField, props.scheme]);

    useEffect(() => {
        if (selectedCollection && selectedCollection.constraints) {
            let constraints = Object.keys(selectedCollection.constraints)
                .sort()
                .map((key) => {
                    return { key: key, value: selectedCollection.constraints[key] };
                });
            if (selectedCollection["type"]) {
                const allowed_constraints = getConstraintValues(selectedCollection.type, false);
                constraints = constraints.filter((c) => allowed_constraints.includes(c["key"]));
            }
            setConstraints(constraints);
        }
    }, [selectedCollection]);

    useEffect(() => {
        if (selectedField) setSelectedConfg(selectedField);
        setNewFieldName("");
    }, [props.config]);

    function setFieldsList() {
        let existing_fields = [];
        let unfiltered_existing_fields = [];
        if (props.config.Validators) {
            table_fields =
                props.scheme && props.scheme.fields
                    ? props.scheme.fields
                          .filter((f) => {
                              return f["types"] && ["object", "array"].includes(f["types"][0]["type"]) && f.name.includes("CurrentState.") && f.name.includes(".[]");
                          })
                          .map((f) => f.name.replace(/\.\[\]/g, "").replace("CurrentState.", ""))
                    : [];
            const array_fields =
                props.scheme && props.scheme.fields
                    ? props.scheme.fields
                          .filter((f) => {
                              return f["types"] && ["object", "array"].includes(f["types"][0]["type"]) && f.name.includes("CurrentState.");
                          })
                          .filter((f) => !props.scheme.fields.find((f2) => f2.name === f.name + ".[]" && f2["types"] && !["object", "array"].includes(f2["types"][0]["type"])))
                          .map((f) => (f.name.indexOf(".") > 0 ? f.name.split(".")[1] : f.name))
                    : [];

            existing_fields = props.config.Validators.slice(0);
            if (props.config.global_automatic_updates) {
                props.config.global_automatic_updates.forEach((g) => {
                    if (g.updatable_fields) {
                        g.updatable_fields.forEach((f) => {
                            if (!existing_fields.find((f1) => f1.name === f)) existing_fields.push({ name: f });
                        });
                    }
                });
            }
            repeating_fields = [];
            empty_fields = [];
            empty_validators = existing_fields
                .filter((v) => !v.type)
                .map((v) => v.name)
                .filter((f) => typeof f === "string");
            existing_fields = existing_fields.map((f) => f.name).filter((f) => typeof f === "string");
            only_validatior_fields = existing_fields.slice(0);
            unfiltered_existing_fields = existing_fields.slice(0);

            field_scheme_values = {};
            if (props.scheme && props.scheme.fields) {
                props.scheme.fields.forEach((field) => {
                    const ar = field.name.split(".");
                    let name = "";
                    if (ar.length === 6 && ar[0] === "CurrentState") {
                        name = ar[1] + "." + ar[3] + "." + ar[5];
                    }
                    if (ar.length === 4 && ar[0] === "CurrentState") {
                        name = ar[1] + "." + ar[3];
                    }
                    if (ar.length === 2 && ar[0] === "CurrentState") {
                        name = ar[1];
                    }
                    if (name === "") return;
                    if (!existing_fields.includes(name)) {
                        existing_fields.push(name);
                        empty_fields.push(name);
                    }
                    field_scheme_values[name] = field;
                    var index = only_validatior_fields.indexOf(name);
                    if (index >= 0) only_validatior_fields.splice(index, 1);
                });

                existing_fields = existing_fields.filter((f) => !array_fields.includes(f));
                empty_fields = empty_fields.filter((f) => !array_fields.includes(f));
            }
            unfiltered_existing_fields = existing_fields.slice(0);
            existing_fields = existing_fields.filter((name) => filterField === "" || name.toLowerCase().includes(filterField.toLowerCase()));
            empty_fields = empty_fields.filter((name) => filterField === "" || name.toLowerCase().includes(filterField.toLowerCase()));

            let reps = [];
            existing_fields.forEach((f, i) => {
                if (reps.includes(f)) repeating_fields.push(f);
                else reps.push(f);
            });
        }
        try {
            fields = props.scheme.fields
                .filter((f) => {
                    const ar = f.name.split(".");
                    if (ar.length > 1 && ar[0] === "CurrentState") return true;
                    else return false;
                })
                .map((f) => f.name.replace("CurrentState.", "").replace(".[].", "."))
                .filter((f) => {
                    return f[f.length - 1] !== "]" && (!existing_fields || !existing_fields.includes(f));
                });
        } catch {
            fields = [];
        }
        setExistingFields(existing_fields);
        setUnfilterdExistingFields(unfiltered_existing_fields);
    }

    function setSelectedConfg(field, is_new = false) {
        setFormType("html");
        setSelectedField(field);
        global_updates = null;
        if (props.config.global_automatic_updates) global_updates = props.config.global_automatic_updates.filter((g) => g.updatable_fields.includes(field));
        if (!is_new) setNewFieldName("");
        if (field && props.config.Validators) {
            const col = props.config.Validators.find((t) => t.name === field);
            if (col) {
                setSelectedCollection(col);
                if (col.constraints)
                    setConstraints(
                        Object.keys(col.constraints)
                            .sort()
                            .map((key) => {
                                return { key: key, value: col.constraints[key] };
                            })
                    );
                else setConstraints([]);
            } else {
                let new_validator = null;
                if (field === "new_field") {
                    new_validator = { name: "", type: "text", constraints: {} };
                } else {
                    new_validator = { name: field, type: "", constraints: {} };
                }
                setSelectedCollection(new_validator);
                setConstraints([]);
            }
        }
    }

    function setDataType(type) {
        let col = Object.assign({}, selectedCollection);
        col["type"] = type;
        setSelectedCollection(col);
    }

    function setConstraintValue(value, index, key = "") {
        let con = constraints.slice(0);
        if (selectedCollection.type.includes("enumerate") && typeof value === "string" && key !== "Custom Function") {
            value = value.replace(/\,\s/g, ",").split(",");
        }
        if (Array.isArray(value)) value = value.map((v) => v.slice(v[0] === " " ? 1 : 0));
        con[index] = { key: con[index].key, value: value };
        //  if(selectedCollection.type.includes('date') && ['gt', 'gte', 'lt', 'lte'].includes(con[index].key))
        //  con[index].value = new Date(value).toISOString();
        setConstraints(con);
    }

    function setConstraintKey(key, index) {
        let con = constraints.slice(0);
        con[index] = { key: key, value: con[index].value };
        setConstraints(con);
    }

    function getSiblingFields(fields, f, include_top = true) {
        return fields.filter((f2) => {
            if (f2 === f) return false;
            const ar = f.split(".");
            const ar2 = f2.split(".");
            if (include_top && ar2.length === 1) return true;
            if (ar.length !== ar2.length) return false;
            return ar[ar.length - 2] === ar2[ar2.length - 2];
        });
    }

    function constraintValue(key, value, index) {
        if (["multiple", "positive", "negative", "lt_now", "nullable", "unique"].includes(key))
            return (
                <Select
                    placeholder='Select value'
                    data-qa='constraint-value'
                    value={value}
                    options={[
                        { text: "true", value: true },
                        { text: "false", value: false }
                    ]}
                    onChange={(e, data) => {
                        setConstraintValue(data.value, index);
                    }}
                />
            );
        if (selectedField.split(".").length > 1 && ["gte", "gt", "lt", "lte"].includes(key)) {
            return (
                <Select
                    search
                    searchQuery={(value.toString() || "").toString()}
                    className='values-column compare_field_selector'
                    options={getSiblingFields(unfilteredExistingFields, selectedField).map((f) => ({ value: f, text: f }))}
                    onChange={(e, data) => {
                        setConstraintValue(data.value, index);
                    }}
                    onSearchChange={(e, data) => {
                        setConstraintValue(data.searchQuery, index);
                    }}
                    value={value || ""}
                />
            );
        }
        if (key === "values") {
            return (
                <CreatableSelect
                    isMulti
                    className=''
                    styles={{ width: "300px" }}
                    value={(value || []).map((f) => ({
                        value: f.toString(),
                        label: f.toString()
                    }))}
                    onChange={(values, m) => setConstraintValue(values ? values.map((v) => v.label) : [], index)}
                    options={[]}
                />
            );
        }
        if (key === "Exclusive value") {
            //if(!selectedCollection.constraints.values) return null;
            let values = constraints.find((c) => c.key === "values");
            if (!values || !Array.isArray(values.value)) values = [];
            else values = values.value;
            return (
                <Select
                    search
                    multiple
                    className='values-column compare_field_selector'
                    options={values.map((f) => ({ value: f, text: f }))}
                    onChange={(e, data) => {
                        setConstraintValue(data.value, index);
                    }}
                    value={value}
                />
            );
        }
        if (key === "Blocking value group field") {
            return (
                <React.Fragment>
                    <br />
                    <span className='values-column compare_field_selector'>
                        <SortableMultiSelect
                            isMulti={true}
                            styles={{ width: "300px" }}
                            value={(value || []).map((f) => ({ value: f, label: f }))}
                            onChange={(values, m) => setConstraintValue(values ? values.map((v) => v.label) : [], index)}
                            options={getSiblingFields(existingFields, selectedField, false).map((f) => ({ value: f, label: f }))}
                        />
                    </span>
                </React.Fragment>
            );
        }
        if (key === "Custom Function") {
            return (
                <TextArea
                    style={{ width: "500px", outline: "0px" }}
                    onChange={(e, data) => {
                        setConstraintValue(data.value, index, key);
                    }}
                    value={value || ""}
                    data-qa='constraint-value'
                />
            );
        }
        return Array.isArray(value) ? (
            <Input onChange={(e) => setConstraintValue(e.target.value.split(","), index)} value={value.join(", ")} />
        ) : (
            <Input type={selectedCollection.type.includes("numeric") ? "number" : "text"} onChange={(e) => setConstraintValue(e.target.value, index)} value={value} />
        );
    }

    function removeConstraint(index) {
        let con = constraints.slice(0, index);
        let con2 = constraints.slice(index + 1);
        setConstraints(con.concat(con2));
    }

    function addConstraint() {
        let con = constraints.slice(0);
        con.push({ key: "", value: "" });
        setConstraints(con);
    }

    function getConstraintValues(type, filter = true) {
        let types = [];
        switch (type) {
            case "enumerate":
            case "enumerate_array":
                if (constraints.find((c) => c.key === "values")) types = ["multiple", "values", "nullable", "unique", "Exclusive value", "Custom Function"];
                else types = ["multiple", "values", "nullable", "unique", "Custom Function"];
                break;
            case "text_array":
                types = ["nullable", "Custom Function", "maxLength", "pattern", "minLength"];
                break;
            case "numeric_array":
                types = ["nullable", "Custom Function", "gte", "lte", "gt", "lt", "positive"];
                break;
            case "numeric":
                types = ["gte", "lte", "nullable", "positive", "gt", "lt", "Custom Function"];
                break;
            case "text":
                types = ["nullable", "maxLength", "pattern", "minLength", "Custom Function"];
                break;
            case "isodate":
                types = ["lt_now", "nullable", "gte", "lte", "gt", "lt", "Custom Function"];
                break;
            case "date":
                types = ["nullable", "gte", "lte", "gt", "lt", "Custom Function"];
                break;
            case "bool":
                types = ["nullable", "Custom Function"];
                break;
            case "url":
                types = ["Custom Function"];
                break;
        }
        return filter ? types.filter((type) => !constraints.find((c) => c.key === type)) : types;
    }

    function is_date(item) {
        return !isNaN(Date.parse(item)) && item.match(/[0-9]{4}\-[0-9]{2}\-[0-9]{2}.*[0-9]{2}\:[0-9]{2}\:[0-9]{2}/g) !== null;
    }

    function save() {
        let con = {};
        if (formType === "json" && window.validator_json_error) {
            alert("You are trying to save incorrect json object!");
            return;
        }
        if (selectedField !== "new_field") {
            const validator = props.config.Validators.find((t) => t.name === selectedField);
            if (validator || field_scheme_values[selectedField]) {
                let type = validator ? validator.type : "";
                let selected_type = selectedCollection.type === "text" ? "string" : selectedCollection.type;
                let scheme_type_includes = field_scheme_values[selectedField] && field_scheme_values[selectedField].types.map((t) => t.type).includes(selected_type);
                if ((selectedCollection.type !== type && validator) || (!validator && !scheme_type_includes)) {
                    let message = "";
                    if (!field_scheme_values[selectedField] || scheme_type_includes) {
                        message = "You are about to change the datatype of this field. This can have a significant impact on how the app saves and interprets data. ";
                    } else {
                        message =
                            "You are about to change the datatype of this field to one that is not in the underlying dataset. Are you sure? This can have a very significant impact on how the app saves and interprets data. ";
                    }
                    const auto_updates = props.config.update_logics
                        ? props.config.update_logics.filter((u) => u.updated_field === selectedField || (u.dependency_fields || []).includes(selectedField))
                        : [];
                    const global_updates = props.config.global_updates ? props.config.global_updates.filter((u) => u.updatable_fields.includes(selectedField)) : [];
                    const api_updates = props.config.api_updates
                        ? props.config.api_updates.filter(
                              (u) => Object.values(u.fields_to_update).includes(selectedField) || Object.values(u.dependency_fields).includes(selectedField)
                          )
                        : [];
                    let updates_found = false;
                    if (api_updates.length || auto_updates.length || global_updates.length) {
                        updates_found = true;
                        message += `\n Changing the datatype will also affect this Automatic Updates ` + (api_updates.length > 0 ? "and Api Calls" : "") + ":";
                        message += auto_updates.map((u, index) => (u.name ? u.name : "Auto Update " + index.toString())).join(", ") + (auto_updates.length ? ", " : "");
                        message += global_updates.map((u, index) => (u.name ? u.name : "Global Updates " + index.toString())).join(", ") + (global_updates.length ? ", " : "");
                        message += api_updates.map((u, index) => (u.name ? u.name : "Api Updates " + index.toString())).join(", ") + (api_updates.length ? ", " : "");
                    }
                    if (props.config.Charts && props.config.Charts.charting_options) {
                        const charts = props.config.Charts.charting_options.filter((c) => selectedField.includes(c.ArrayFieldName.replace("CurrentState.", "")));
                        if (charts.length)
                            message +=
                                (updates_found ? " and this Charts: " : "Changing the datatype will also affect this Charts: ") + charts.map((c) => c.ArrayFieldName).join(", ");
                    }
                    if (!window.confirm(message)) return;
                }
            }
        }
        if (
            constraints.find((c) => {
                return c.key === "" || c.value === "";
            })
        ) {
            alert("Empty constraints are not allowed.");
            return;
        }
        if (
            ["date", "isodate"].includes(selectedCollection.type) &&
            constraints.find((c) => {
                return ["gte", "lte", "gt", "lt"].includes(c.key) && !is_date(c.value);
            })
        ) {
            alert("gt and lt contraints should be date strings");
            return;
        }
        constraints.forEach((el) => {
            if (el.key === "Exclusive value" && !constraints.find((c) => c.key === "values")) return;
            if (
                el.key.includes("ength") ||
                (selectedCollection.type.includes("numeric") && (el.key.includes("lt") || el.key.includes("gt")) && !existingFields.includes(el.value))
            ) {
                con[el.key] = parseFloat(el.value);
            } else con[el.key] = el.value;
        });
        if (con["lt"] && con["gt"] && con["lt"] <= con["gt"]) {
            alert("Lt value should be greater than gt");
            return;
        }
        if (con["lt"] && con["gte"] && con["lt"] <= con["gte"]) {
            alert("Lt value should be greater than gte");
            return;
        }
        if (con["lte"] && con["gte"] && con["lte"] <= con["gte"]) {
            alert("Lte value should be greater than gte");
            return;
        }
        if (con["lte"] && con["gt"] && con["lte"] <= con["gt"]) {
            alert("Lte value should be greater than gt");
            return;
        }
        if (
            selectedCollection.type.includes("enumerate") &&
            !constraints.find((c) => {
                return c.key === "values";
            })
        ) {
            alert("Values constraint must be set");
            return;
        }

        let col = Object.assign({}, selectedCollection);
        col["constraints"] = con;
        if (newfieldName) col["name"] = newfieldName;
        if (col["name"] === "") {
            alert("You need to set field name");
            return;
        }
        setSelectedCollection(col);
        props.updateConfg({
            data: col,
            field: "Validators",
            activeCollection: props.collection,
            is_new: newfieldName != "",
            is_delete: false
        });
    }

    function deleteValidator() {
        if (window.confirm("Do you want to delete this validator?"))
            props.updateConfg({
                data: selectedCollection,
                field: "Validators",
                activeCollection: props.collection,
                is_new: newfieldName != "",
                is_delete: true
            });
    }

    function getDatatypes(type) {
        return type === "date" ? dataTypes.concat("date") : dataTypes;
    }

    function getValidatorClassName(name) {
        return (
            "validator_item " +
            (selectedField === name ? "selected" : "") +
            (empty_fields.includes(name) ? " empty" : "") +
            (only_validatior_fields.includes(name) ? " not_in_data" : "") +
            (repeating_fields.includes(name) ? " repeated" : "") +
            (empty_validators.includes(name) ? " no_type" : "")
        );
    }

    //setFieldsList();
    const update_index = selectedField && props.config.update_logics ? props.config.update_logics.findIndex((u) => u.updated_field === selectedField) : [];
    return (
        <React.Fragment>
            <SegmentGroup>
                <Segment textAlign='center' style={{ width: "100%" }}>
                    Set Validators For Fields
                </Segment>
                <Segment>
                    <Grid relaxed='very' columns='equal'>
                        <Grid.Column>
                            <Input placeholder='Filter Fields' onChange={(e) => setFilterField(e.target.value)} className='validator-fields-filter' data-qa='search-validator' />
                            <div className='validators-container fields-list' data-qa='validators-fields'>
                                {existingFields.map((name, index) => {
                                    const t = (
                                        <div
                                            data-qa={name}
                                            key={name + "key" + index}
                                            t={name}
                                            className={getValidatorClassName(name)}
                                            onClick={() => setSelectedConfg(name)}
                                            data-qa-empty={empty_fields.includes(name) ? "true" : "false"}
                                        >
                                            {name}
                                        </div>
                                    );
                                    if (empty_validators.includes(name))
                                        return <Popup data-qa='validator-tooltip' key={name + index} content='Validator without type' trigger={t} />;
                                    if (only_validatior_fields.includes(name))
                                        return (
                                            <Popup data-qa='validator-tooltip' key={name + index} content="Field not in dataset, only in configuration's validators" trigger={t} />
                                        );
                                    return t;
                                })}
                            </div>
                            {/*<div className="validators-container">
                                    <Button data-qa="add-validator-btn" onClick={()=>setSelectedConfg('new_field', true)}>Add Field</Button>
                                </div>*/}
                        </Grid.Column>
                        <Grid.Column width={9}>
                            {selectedField && (
                                <div className='validators-container values-list' data-qa='validators-values' style={{ marginLeft: "-50px" }}>
                                    <div style={{ overflow: "hidden" }}>
                                        <span className='names-column'>Field Name</span>
                                        {selectedField === "new_field" ? (
                                            <Select
                                                style={{ minWidth: "400px" }}
                                                search
                                                options={fields.map((item) => ({
                                                    text: item,
                                                    value: item
                                                }))}
                                                value={newfieldName}
                                                data-qa='field-name'
                                                onChange={(e, data) => {
                                                    setNewFieldName(data.value);
                                                }}
                                                className='values-column'
                                            />
                                        ) : (
                                            <span className='values-column' data-qa='field-name'>
                                                {selectedField}
                                            </span>
                                        )}
                                        {field_scheme_values[selectedField] && (
                                            <Table className='validator_datatypes_table'>
                                                <Table.Header>
                                                    <Table.Row>
                                                        <Table.HeaderCell data-qa='existing-dt'>Existing Datatypes</Table.HeaderCell>
                                                        <Table.HeaderCell data-qa='records-number'>Number of Records</Table.HeaderCell>
                                                    </Table.Row>
                                                </Table.Header>
                                                <Table.Body>
                                                    {field_scheme_values[selectedField].types.map((row) => (
                                                        <Table.Row key={"scheme_data_row_" + row.type}>
                                                            <Table.Cell data-qa='existing-dt-val'>{row.type}</Table.Cell>
                                                            <Table.Cell data-qa='records-number-val'>{row.count}</Table.Cell>
                                                        </Table.Row>
                                                    ))}
                                                </Table.Body>
                                            </Table>
                                        )}
                                    </div>
                                    {update_index >= 0 ? (
                                        <div>
                                            <span className='names-column'>Updated by</span>{" "}
                                            <span data-qa='updated-by-fields' className='values-column'>
                                                {props.config.update_logics[update_index].name
                                                    ? props.config.update_logics[update_index].name
                                                    : "Auto update " + (update_index + 1)}
                                            </span>
                                        </div>
                                    ) : null}
                                    {global_updates && global_updates.length > 0 && (
                                        <div>
                                            <span className='names-column'>Created by</span>
                                            {global_updates.map((g, i) => (
                                                <span data-qa='updated-by-fields' className='values-column'>
                                                    {g.name ? g.name : "Global update " + (i + 1)}
                                                    {i + 1 < global_updates.length && ", "}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <span className='json-toggle'>
                                        <Radio
                                            data-qa='to-json'
                                            checked={formType === "json"}
                                            onChange={(e, data) => {
                                                setFormType(data.checked ? "json" : "html");
                                            }}
                                            toggle
                                        />{" "}
                                        <span>JSON</span>{" "}
                                    </span>
                                    {formType === "html" ? (
                                        <React.Fragment>
                                            <div className='datatype_row'>
                                                <span className='names-column'>Datatype</span>
                                                <Select
                                                    className='values-column'
                                                    options={getDatatypes(selectedCollection.type).map((item) => ({ text: item, value: item }))}
                                                    data-qa='data-type'
                                                    onChange={(e, data) => {
                                                        setDataType(data.value);
                                                    }}
                                                    value={selectedCollection.type}
                                                />
                                            </div>

                                            {selectedCollection["DisplayDropDown"] !== undefined && (
                                                <div>
                                                    <span className='names-column'>DisplayDropDown</span>
                                                    <Select
                                                        className='values-column'
                                                        options={[
                                                            { text: "true", value: true },
                                                            { text: "false", value: false }
                                                        ]}
                                                        onChange={(e, data) => {
                                                            setSelectedCollection({
                                                                ...selectedCollection,
                                                                DisplayDropDown: data.value
                                                            });
                                                        }}
                                                        value={selectedCollection["DisplayDropDown"]}
                                                    />
                                                </div>
                                            )}
                                            {constraints.length > 0 &&
                                                constraints.map((con, index) => {
                                                    return (
                                                        <div className='constraint_row' key={"constraint_row" + index}>
                                                            <span className='names-column'>Constraint {index + 1}</span>
                                                            <span className='values-column'>
                                                                <span className={con.key === "values" ? "validator_values_selector" : ""}>
                                                                    <Select
                                                                        search
                                                                        selectOnBlur={false}
                                                                        options={getConstraintValues(selectedCollection["type"]).map((item) => ({
                                                                            text: item,
                                                                            value: item
                                                                        }))}
                                                                        value={con.key}
                                                                        searchQuery={con.key}
                                                                        onChange={(e, data) => {
                                                                            setConstraintKey(data.value, index);
                                                                        }}
                                                                        onSearchChange={(e, data) => {
                                                                            setConstraintKey(data.searchQuery, index);
                                                                        }}
                                                                        className='constraint-key'
                                                                        data-qa-name={con.key}
                                                                        data-qa-val={con.value}
                                                                        data-qa='constraint-name'
                                                                    />
                                                                </span>
                                                                <span
                                                                    className={"constraint-value validator_constraints_key_" + con.key.replace(" ", "_")}
                                                                    data-qa='constraint-value'
                                                                >
                                                                    {constraintValue(con.key, con.value, index)}
                                                                </span>
                                                                <Button data-qa='remove-constraint' onClick={() => removeConstraint(index)} className='validator-remove-button'>
                                                                    Remove
                                                                </Button>
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            <div>
                                                <Button
                                                    className='add_constraint_button'
                                                    data-qa='add-constraint'
                                                    onClick={() => {
                                                        addConstraint();
                                                    }}
                                                >
                                                    Add Constraint
                                                </Button>
                                            </div>
                                        </React.Fragment>
                                    ) : (
                                        <JsonForm setCollection={(data) => setSelectedCollection(data)} data={selectedCollection} />
                                    )}
                                    <div>
                                        <Button
                                            data-qa='cancel-validator'
                                            onClick={() => {
                                                setSelectedConfg(selectedField);
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            className='save_validator_button'
                                            data-qa='save-validator'
                                            onClick={() => {
                                                save();
                                            }}
                                            style={{ marginLeft: "20px" }}
                                        >
                                            Save
                                        </Button>
                                        {selectedField !== "new_field" && selectedCollection.type && (
                                            <Button
                                                data-qa='remove-validator'
                                                onClick={() => {
                                                    deleteValidator();
                                                }}
                                                style={{ marginLeft: "20px" }}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Grid.Column>
                    </Grid>
                </Segment>
            </SegmentGroup>
        </React.Fragment>
    );
};

export default ValidationForm;
