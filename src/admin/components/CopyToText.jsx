import React, { useState, useEffect } from "react";
import { Grid, GridRow, GridColumn, Dropdown, Segment, SegmentGroup, Button, Checkbox } from "semantic-ui-react";
import Prism from "prismjs";
import "./Updates/editor.scss";
import Editor from "react-simple-code-editor";
import _ from "lodash";
import SortableMultiSelect from "./SortableMultiSelect";

let subfields_list = [];
let list = [];
let table_list = [];

const CopyToText = (props) => {
    const [selectedField, setSelectedField] = useState("");
    const [copy, setCopy] = useState({});
    const [fields_list, setFieldsList] = useState([]);

    useEffect(() => {
        getFieldsList();
        setCopy(props.config.CopyToText);
    }, [props.config, props.scheme]);

    useEffect(() => {
        if (props.scheme) {
            getFieldsList();
            setSubFieldsList();
        }
        let new_copy = Object.assign({}, copy);
        if (!new_copy.TableCopy) new_copy.TableCopy = {};
        else new_copy.TableCopy = Object.assign({}, copy.TableCopy);
        if (!new_copy.TableCopy[selectedField]) {
            new_copy.TableCopy[selectedField] = {
                value: "",
                fields: subfields_list,
            };
            setCopy(new_copy);
        }
    }, [selectedField]);

    function getFieldsList() {
        list = [];
        table_list = [];
        if (props.scheme) {
            var populated_fields = []; //Array.isArray(props.config.CopyToText) ? props.config.CopyToText.map(s=>s.ArrayFieldName.replace('CurrentState.','')) : [];
            props.scheme.fields.forEach((field) => {
                const ar = field.name.split(".");
                if (ar.length > 2 && ar[0] === "CurrentState" && ar[2] === "[]") {
                    let field_name = null;
                    if (ar.length === 5 && ar[4] === "[]" && field.types && field.types.find((t) => t.type === "array" || t.type === "object")) {
                        field_name = ar[1] + "." + ar[3];
                    }
                    if (ar.length === 3 && ar[2] === "[]" && field.types.find((t) => t.type === "array" || t.type === "object")) {
                        if (props.config.ComplexFields && props.config.ComplexFields.includes(ar[1])) return;
                        field_name = ar[1];
                    }
                    if (field_name) {
                        if (!table_list.includes(field_name)) table_list.push(field_name);
                        if (!populated_fields.includes(field_name)) {
                            empty_list.push(field_name);
                        }
                    }
                }
                if (ar.length === 2 && ar[0] === "CurrentState" && field.level === 1 && !list.includes(ar[1])) list.push(ar[1]);
            });
            const table_fields = props.config.DefaultFieldsToDisplayInAuditSession.filter((f) => f.name).map((f) => f.name);
            list = list.filter((f) => !table_fields.includes(f));
        }
    }

    function setSubFieldsList() {
        subfields_list = [];
        if (props.scheme) {
            const ar2 = selectedField.split(".");
            props.scheme.fields.forEach((field) => {
                const ar = field.name.split(".");
                //console.log(ar);
                if (ar.length == 4 && ar[0] === "CurrentState" && ar[1] === selectedField && ar[2] === "[]") {
                    if (ar[3] !== "_id" && !subfields_list.includes(ar[3])) subfields_list.push(ar[3]);
                }
                if (ar.length === 6 && ar[0] === "CurrentState" && ar[1] === ar2[0] && ar[3] === ar2[1]) {
                    if (ar[6] !== "_id" && !subfields_list.includes(ar[5])) subfields_list.push(ar[5]);
                }
            });
            setFieldsList(subfields_list);
        }
    }

    function setCopyField(value, key) {
        let new_copy = Object.assign({}, copy);
        if (!new_copy.TableCopy) new_copy.TableCopy = {};
        else new_copy.TableCopy = _.cloneDeep(copy.TableCopy);
        new_copy.TableCopy[selectedField][key] = value;
        setCopy(new_copy);
    }

    function setMainFunction(value) {
        let new_copy = Object.assign({}, copy);
        new_copy.mainFunction = value;
        setCopy(new_copy);
    }

    function setMainField(fields) {
        let new_copy = Object.assign({}, copy);
        new_copy.fields = fields;
        setCopy(new_copy);
    }

    function save() {
        props.updateConfg({ data: copy, field: "CopyToText", activeCollection: props.collection });
    }

    var empty_list = [];
    const c = copy && copy.TableCopy && copy.TableCopy[selectedField];
    return (
        <React.Fragment>
            <Grid className="dashboard">
                <GridRow centered>
                    <GridColumn width={7}>
                        <Segment className="segment-dropdown">
                            <Dropdown
                                className="dropdown-main"
                                placeholder="Select Config Field..."
                                data-qa="select-config-field"
                                fluid
                                search
                                selection
                                selectOnBlur={false}
                                options={props.fields_list.map((item) => ({ text: item, value: item }))}
                                onChange={(e, data) => props.onCollectionConfigurationSelect(props.SELECT_TYPE, data)}
                                value={props.activeConfigurationField}
                            />
                        </Segment>
                    </GridColumn>
                </GridRow>
            </Grid>
            {props.isTabEditorActive && (
                <SegmentGroup>
                    <Segment textAlign="center" style={{ width: "100%" }}>
                        Set Text Representation Functions
                    </Segment>
                    <div style={{ marginLeft: "10px", marginBottom: "10px" }}>
                        Allow Text Representation
                        <Checkbox style={{ marginLeft: "10px" }} checked={copy && copy.enabled} onChange={(e, data) => setCopy({ ...copy, enabled: data.checked })} />
                    </div>
                    <div>
                        <SortableMultiSelect
                            data-qa="new-value"
                            placeholder="Select fields"
                            options={list.map((e) => {
                                return { key: e, value: e, label: e };
                            })}
                            isMulti={true}
                            search
                            value={(copy ? copy.fields || [] : []).map((f) => ({ value: f, label: f }))}
                            onChange={(values, m) =>
                                setMainField(
                                    (values || []).map((v) => v.label),
                                    "fields"
                                )
                            }
                        />
                    </div>
                    <div style={{ paddingLeft: "10px", marginTop: "10px" }}>Text Function for top level fields (variables: data - record data, keys - list of keys)</div>
                    <div className={"editor_container"} style={{ width: "700px", margin: "15px" }}>
                        <Editor
                            value={(copy && copy.mainFunction) || ""}
                            data-qa="function"
                            onValueChange={(code) => setMainFunction(code)}
                            highlight={(code) => Prism.highlight(code, Prism.languages.javascript)}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 12,
                                margin: "10px",
                            }}
                        />
                    </div>
                    <Segment>
                        <Grid relaxed="very" columns="equal">
                            <Grid.Column>
                                <div className="charts-container fields-list" data-qa="charts-fields">
                                    {table_list.map((name, index) => {
                                        const t = (
                                            <div
                                                data-qa={name}
                                                key={name + "key" + index}
                                                onClick={() => setSelectedField(name)}
                                                className={selectedField === name ? "selected" : empty_list.includes(name) ? "empty" : ""}
                                                data-qa-empty={""}
                                            >
                                                {name}
                                            </div>
                                        );
                                        return t;
                                    })}
                                </div>
                            </Grid.Column>
                            <Grid.Column width={9}>
                                {selectedField && (
                                    <div className="validators-container values-list" data-qa="validators-values">
                                        <div>Text Function for table (variables: record - record outer fields, data - table data, keys - list of keys in table)</div>
                                        <div>
                                            <SortableMultiSelect
                                                data-qa="new-value"
                                                placeholder="Select fields"
                                                options={fields_list.map((e) => {
                                                    return { key: e, value: e, label: e };
                                                })}
                                                isMulti={true}
                                                search
                                                value={(c ? c.fields || [] : []).map((f) => ({ value: f, label: f }))}
                                                onChange={(values, m) =>
                                                    setCopyField(
                                                        (values || []).map((v) => v.label),
                                                        "fields"
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className={"editor_container"}>
                                            <Editor
                                                value={(c && c.value) || ""}
                                                data-qa="function"
                                                onValueChange={(code) => setCopyField(code, "value")}
                                                highlight={(code) => Prism.highlight(code, Prism.languages.javascript)}
                                                padding={10}
                                                style={{
                                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                                    fontSize: 12,
                                                    margin: "10px",
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Grid.Column>
                            <br />
                            <GridRow style={{ marginLeft: "30px" }}>
                                <Button data-qa="cancel-validator" onClick={() => {}}>
                                    Cancel
                                </Button>
                                <Button
                                    data-qa="save-validator"
                                    onClick={() => {
                                        save();
                                    }}
                                    style={{ marginLeft: "20px" }}
                                >
                                    Save
                                </Button>
                            </GridRow>
                        </Grid>
                    </Segment>
                </SegmentGroup>
            )}
        </React.Fragment>
    );
};

export default CopyToText;
