import React, { useState, useEffect } from "react";
import { Grid, Segment, SegmentGroup, Input, TextArea, Button, GridRow, Dropdown, GridColumn, Checkbox } from "semantic-ui-react";
import Editor from "react-simple-code-editor";
//import JsonForm from '../jsonForm';
import { useSelector } from 'react-redux'
import Prism from "prismjs";
import "./editor.scss";
import CreatableSelect from "react-select/creatable";
import formatDate from '../../../utils/formatDate';
import dashboardSlice from "../../../admin/store/dashboard/slice";

const AutoUpdate = (props) => {
    const [index, setIndex] = useState(null);
    const [update, setUpdate] = useState(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [functionCode, setFunctionCode] = useState("");
    const [dependencyFields, setDependencyFields] = useState([]);
    const [updateField, setUpdateField] = useState(null);
    const [useExternalUsers, setUseExternalUsers] = useState(null);
    
    const {user_type: userType} = useSelector(state => state[dashboardSlice.name]);
    
    useEffect(() => {
        if (update) {
            setFields();
        }
    }, [update]);

    useEffect(() => {
        if (props.updates[index]) {
            setUpdate(props.updates[index]);
        }
    }, [props.updates]);

    function setFields() {
        setDependencyFields(update.dependency_fields);
        setFunctionCode(update.update_logic);
        setUpdateField(update.updated_field);
        setName(update.name ? update.name : "");
        setDescription(update.description ? update.description : "");
        setUseExternalUsers(update.useExternalUsers ? update.useExternalUsers : false);
    }

    function save() {
        let error = false;
        try {
            var f = new Function(["CurrentState"], functionCode);
        } catch (error_value) {
            error = error_value.toString() + " in function " + index;
        }

        if (error) {
            alert(error);
            return;
        }
        if (name === "") {
            alert("`Name` Field must be populated");
            return;
        }
        let update = Object.assign({}, update);
        update["name"] = name;
        update["description"] = description;
        update["dependency_fields"] = dependencyFields;
        update["update_logic"] = functionCode;
        update["updated_field"] = updateField;
        update["useExternalUsers"] = useExternalUsers;
        const error_fields = {
            name: "Name",
            description: "Description",
            dependency_fields: "Dependency Fields",
            update_logic: "Update Function",
            updated_field: "Updated field",
        };
        Object.keys(error_fields).forEach((error_field) => {
            if (error) return;
            if (!update[error_field] || (Array.isArray(update[error_field]) && update[error_field].length === 0)) {
                error = `'${error_fields[error_field]}' Field must be populated`;
            }
        });
        if (error) {
            alert(error);
            return;
        }
        let new_updates = props.updates.slice(0);
        new_updates[index] = update;
        if (userType === 'internal') {
            const confirmed = window.confirm(`Warning!
You are about to change configuration in this collection.
Are you sure? This can have a very significant
impact on how the app and interprets data.`);
        
            if (!confirmed) {
                return;
            }
        }
        props.updateConfg({
            data: new_updates,
            field: "update_logics",
            activeCollection: props.collection,
        });
    }

    function deleteUpdate() {
        if (window.confirm("Are you sure you want do delete this auto update?")) {
            let new_updates = props.updates.slice(0);
            new_updates.splice(index, 1);
            props.updateConfg({
                data: new_updates,
                field: "update_logics",
                activeCollection: props.collection,
            });
            setIndex(null);
            setUpdate(null);
        }
    }

    function addUpdate() {
        let i = props.addAutoUpdate();
        setIndex(i);
    }

    function moveUpdate(new_index) {
        let new_updates = props.updates.slice(0);
        new_updates.splice(new_index, 0, new_updates.splice(index, 1)[0]);
        props.updateConfg({
            data: new_updates,
            field: "update_logics",
            activeCollection: props.collection,
        });
        setIndex(new_index);
    }

    const fields = props.fields;
    const array_fields = props.scheme.fields
        .filter((f) => f.types && f.types.length === 1 && f.types[0].type === "array")
        .map((f) => f.name.replace("CurrentState.", "").replace(/\.\[\]/g, ""));
    return (
        <React.Fragment>
            <div>
                <Button onClick={addUpdate}>Create new Auto Update</Button>
                <span> Set new position </span>
                <Dropdown
                    placeholder=""
                    selectOnBlur={false}
                    value={null}
                    options={props.updates.map((item, index) => ({
                        text: index + 1,
                        value: index,
                    }))}
                    onChange={(e, data) => {
                        moveUpdate(data.value);
                    }}
                />
            </div>
            <SegmentGroup>
                <Segment textAlign="center" style={{ width: "100%" }}>
                    <div>Set Auto Updates</div>
                    <Grid className="dashboard">
                        <GridColumn width={14}>
                            <GridRow>
                                <Dropdown
                                    placeholder="Select Update"
                                    style={{ margin: "15px auto" }}
                                    selection
                                    selectOnBlur={false}
                                    value={index}
                                    options={props.updates.map((item, index) => ({
                                        text: item.name ? item.name : "Auto Update " + (index + 1),
                                        value: index,
                                    }))}
                                    onChange={(e, data) => {
                                        setIndex(data.value);
                                        setUpdate(props.updates[data.value]);
                                    }}
                                />
                            </GridRow>
                            {update && (
                                <React.Fragment>
                                    <div style={{ textAlign: "left" }}>Current update position: {index + 1}</div>
                                    <GridRow>
                                        <div style={{ margin: "10px" }}>Name</div> <br />
                                        <Input
                                            data-qa="name"
                                            style={{
                                                minWidth: "600px",
                                                padding: "15px",
                                            }}
                                            onChange={(e, data) => setName(data.value)}
                                            value={name}
                                        />
                                    </GridRow>{" "}
                                    <br />
                                    <GridRow>
                                        <div style={{ margin: "10px" }}>Description</div> <br />
                                        <TextArea
                                            data-qa="description"
                                            style={{
                                                minWidth: "900px",
                                                padding: "15px",
                                            }}
                                            onChange={(e, data) => setDescription(data.value)}
                                            value={description}
                                        />
                                    </GridRow>
                                    <br />
                                    <GridRow>
                                        <div style={{ margin: "10px" }}>Dependency fields</div>
                                        <div
                                            data-qa="matching_fields"
                                            style={{
                                                display: "block",
                                                marginLeft: "10px",
                                                width: "100%",
                                            }}
                                        >
                                            <CreatableSelect
                                                isMulti
                                                data-qa="dependecy_fields"
                                                styles={{ width: "300px" }}
                                                value={dependencyFields.map((f) => ({
                                                    value: f,
                                                    label: f,
                                                }))}
                                                onChange={(values, m) => setDependencyFields(values ? values.map((v) => v.label) : [])}
                                                options={fields.concat(array_fields).map((f) => ({
                                                    value: f,
                                                    label: f,
                                                }))}
                                            />
                                        </div>
                                    </GridRow>
                                    <br />
                                    <GridRow>
                                        <div style={{ margin: "10px" }}>Update field</div>
                                        <div
                                            data-qa="updatable_fields"
                                            style={{
                                                display: "block",
                                                marginLeft: "10px",
                                                width: "100%",
                                            }}
                                        >
                                            <CreatableSelect
                                                data-qa="update_field"
                                                styles={{ width: "300px" }}
                                                value={{
                                                    value: updateField,
                                                    label: updateField,
                                                }}
                                                onChange={(value, m) => setUpdateField(value.label)}
                                                options={array_fields.concat("None").map((f) => ({
                                                    value: f,
                                                    label: f,
                                                }))}
                                            />
                                        </div>
                                    </GridRow>{" "}
                                    <br />
                                    <GridRow>
                                        <div style={{ margin: "10px" }}>Update Function</div>
                                        <div className={"editor_container"}>
                                            <Editor
                                                value={functionCode}
                                                data-qa="function"
                                                onValueChange={(code) => setFunctionCode(code)}
                                                highlight={(code) => Prism.highlight(code, Prism.languages.javascript)}
                                                padding={10}
                                                style={{
                                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                                    fontSize: 12,
                                                    margin: "10px",
                                                }}
                                            />
                                        </div>
                                    </GridRow>{" "}
                                    <br />
                                    <GridRow>
                                        <span className="score-names-column">Load External Users</span>
                                        <span className="scoretext_column">
                                            <Checkbox style={{ minWidth: "600px" }} onChange={(e, data) => setUseExternalUsers(data.checked)} checked={useExternalUsers} />
                                        </span>
                                    </GridRow>
                                    <br />
                                    <br />
                                    <GridRow style={{ marginLeft: "10px" }}>
                                        <Button
                                            data-qa="cancel-validator"
                                            onClick={() => {
                                                setFields();
                                            }}
                                        >
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
                                        <Button
                                            data-qa="delete-validator"
                                            onClick={() => {
                                                deleteUpdate();
                                            }}
                                            style={{ marginLeft: "20px" }}
                                        >
                                            Delete
                                        </Button>
                                    </GridRow>
                                </React.Fragment>
                            )}
                        </GridColumn>
                    </Grid>
                </Segment>
            </SegmentGroup>
        </React.Fragment>
    );
};
export default AutoUpdate;
