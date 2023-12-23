import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import { Grid, Segment, SegmentGroup, Input, Button, GridRow, Dropdown, GridColumn, Checkbox } from "semantic-ui-react";
import formatDate from '../../../utils/formatDate';
import dashboardSlice from '../../../admin/store/dashboard/slice';

const ApiUpdate = (props) => {
    const [index, setIndex] = useState(null);
    const [collection, setCollection] = useState("");
    const [apiUpdates, setApiUpdates] = useState([]);
    const [update, setUpdate] = useState(null);
    const [on, setOn] = useState(true);
    const [name, setName] = useState("");
    const [urlField, setUrlField] = useState("");
    const [token, setToken] = useState("");
    const [mode, setMode] = useState("");
    const [baseUrl, setBaseUrl] = useState("");
    const [dependencyFields, setDependencyFields] = useState([]);
    const [fieldsUpdated, setFieldsUpdated] = useState([]);
    
    const {user_type: userType} = useSelector(state => state[dashboardSlice.name]);
    
    useEffect(() => {
        if (props.config.api_updates && props.config.api_updates.length > 0) {
            setApiUpdates(props.config.api_updates);
            if (collection !== props.config.CollectionRelevantFor) {
                setCollection(props.config.CollectionRelevantFor);
                setIndex(null);
                setUpdate(null);
            } else {
                if (index !== null) setUpdate(props.config.api_updates[0]);
            }
        } else {
            setIndex(null);
            setApiUpdates([]);
            setUpdate(null);
        }
    }, [props.config]);

    useEffect(() => {
        if (update) {
            setFields();
        }
    }, [update]);

    function setFields() {
        let depFields = {};
        setDependencyFields(Object.keys(update.dependency_fields).map((f) => ({ key: f, value: update.dependency_fields[f] })));
        setFieldsUpdated(Object.keys(update.fields_to_update).map((f) => ({ key: f, value: update.fields_to_update[f] })));
        setUrlField(update.url_field);
        setToken(update.token);
        setBaseUrl(update.base_url);
        setName(update.name ? update.name : "");
        setMode(update.mode ? update.mode : "closest");
    }

    function save() {
        let error = false;
        let new_updates = apiUpdates.slice(0);
        let new_update = {};
        new_update["name"] = name;
        new_update["mode"] = mode;
        new_update["token"] = token;
        new_update["base_url"] = baseUrl;
        new_update["url_field"] = urlField;
        if (dependencyFields.filter((f) => f.key && f.value).length == 0) error = "You need to set API parameters";
        if (fieldsUpdated.filter((f) => f.key && f.value).length == 0) error = "You need to set Fields to be updated by API";
        if (error) {
            alert(error);
            return;
        }
        new_update["dependency_fields"] = Object.assign(
            ...dependencyFields
                .filter((f) => f.key && f.value)
                .map((v) => {
                    var t = {};
                    t[v.key] = v.value;
                    return t;
                })
        );
        new_update["fields_to_update"] = Object.assign(
            ...fieldsUpdated
                .filter((f) => f.key && f.value)
                .map((v) => {
                    var t = {};
                    t[v.key] = v.value;
                    return t;
                })
        );
        const error_fields = { name: "API", dependency_fields: "API parameters", base_url: "API base url", token: "API token", fields_to_update: "Updated fields" };
        Object.keys(error_fields).forEach((error_field) => {
            if (error) return;
            if (!new_update[error_field] || (Array.isArray(new_update[error_field]) && new_update[error_field].length === 0)) {
                error = `'${error_fields[error_field]}' Field must be populated`;
            }
        });
        if (error) {
            alert(error);
            return;
        }
        if (index !== null && index < new_updates.length) new_updates[index] = new_update;
        else new_updates.push(new_update);
        if (userType === 'internal') {
            const confirmed = window.confirm(`Warning!
You are about to change configuration in this collection.
Are you sure? This can have a very significant
impact on how the app and interprets data.`);
        
            if (!confirmed) {
                return;
            }
        }
        props.updateConfg({ data: new_updates, field: "api_updates", activeCollection: props.collection });
    }

    function deleteUpdate() {
        if (window.confirm("Are you sure you want do delete this auto update?")) {
            let new_updates = apiUpdates.slice(0);
            new_updates.splice(index, 1);
            props.updateConfg({ data: new_updates, field: "api_updates", activeCollection: props.collection });
            setIndex(null);
            setUpdate(null);
        }
    }

    function moveUpdate(new_index) {
        let new_updates = apiUpdates.slice(0);
        new_updates.splice(new_index, 0, new_updates.splice(index, 1)[0]);
        props.updateConfg({ data: new_updates, field: "api_updates", activeCollection: props.collection });
        setIndex(new_index);
    }

    function setDepKey(index, key, value) {
        let fields = dependencyFields.slice(0);
        fields[index][key] = value;
        setDependencyFields(fields);
    }

    function setUpdatedKey(index, key, value) {
        let fields = fieldsUpdated.slice(0);
        fields[index][key] = value;
        setFieldsUpdated(fields);
    }

    const removeDepField = (index) => {
        let fields = dependencyFields.slice(0);
        fields.splice(index, 1);
        setDependencyFields(fields);
    };

    const removeUpdatedField = (index) => {
        let fields = fieldsUpdated.slice(0);
        fields.splice(index, 1);
        setFieldsUpdated(fields);
    };

    function addUpdate() {
        let new_updates = apiUpdates.slice(0);
        new_updates.push({
            on: true,
            dependency_fields: [],
            fields_to_update: [],
            url_field: null,
            base_url: "",
            token: ""
        });
        setApiUpdates(new_updates);
        setIndex(new_updates.length - 1);
        setUpdate(new_updates[new_updates.length - 1]);
    }

    const fields = props.scheme
        ? props.scheme.fields
              .filter((f) => {
                  if (f.types.length > 0 && f.types[0].type === "array") return false;
                  const ar = f.name.split(".");
                  if (ar.length > 1 && (ar[0] === "CurrentState" || ar[0] === "AuditState")) return true;
                  else return false;
              })
              .map((f) => f.name.replace("CurrentState.", "").replace("AuditState.", "").replace(".[].", "."))
              .filter((f) => {
                  return f[f.length - 1] !== "]";
              })
        : [];
    return (
        <React.Fragment>
            <div>
                <Button onClick={addUpdate}>Create new API Update</Button>
                <span> Set new position </span>
                <Dropdown
                    placeholder=''
                    selectOnBlur={false}
                    value={null}
                    options={apiUpdates.map((item, index) => ({ text: index + 1, value: index }))}
                    onChange={(e, data) => {
                        moveUpdate(data.value);
                    }}
                />
            </div>
            <SegmentGroup>
                <Segment textAlign='center' style={{ width: "100%" }}>
                    <div>Set API Updates</div>
                    <Grid className='dashboard'>
                        <GridColumn width={14}>
                            <GridRow>
                                <Dropdown
                                    placeholder='Select Update'
                                    style={{ margin: "15px auto" }}
                                    selection
                                    selectOnBlur={false}
                                    value={index}
                                    options={apiUpdates.map((item, index) => ({ text: item.name ? item.name : "API Update " + (index + 1), value: index }))}
                                    onChange={(e, data) => {
                                        setIndex(data.value);
                                        setUpdate(apiUpdates[data.value]);
                                    }}
                                />
                            </GridRow>
                            {update && (
                                <React.Fragment>
                                    <div style={{ textAlign: "left" }}>Current update position: {index + 1}</div>
                                    <GridRow>
                                        <div className='api-names-column'>API</div> <br />
                                        <Input data-qa='name' style={{ minWidth: "600px", padding: "15px" }} onChange={(e, data) => setName(data.value)} value={name} />
                                    </GridRow>{" "}
                                    <br />
                                    <GridRow>
                                        <div className='api-names-column'>API Enabled</div> <br />
                                        <Checkbox data-qa='enabled' style={{ minWidth: "600px", padding: "15px" }} onChange={(e, data) => setOn(data.checked)} checked={on} />
                                    </GridRow>{" "}
                                    <br />
                                    <GridRow>
                                        <span className='api-names-column'>API url field</span>
                                        <span className='api_update_column'>
                                            <Dropdown
                                                placeholder='Select Field'
                                                style={{ margin: "15px auto" }}
                                                selection
                                                search
                                                data-qa='url_field'
                                                selectOnBlur={false}
                                                value={urlField}
                                                options={fields.map((item, index) => ({ text: item, value: item }))}
                                                onChange={(e, data) => {
                                                    setUrlField(data.value);
                                                }}
                                            />
                                        </span>
                                    </GridRow>
                                    <br />
                                    <GridRow>
                                        <span className='api-names-column'>API parameters</span>
                                        <span className='api_update_column'>
                                            {dependencyFields.map((field, index) => (
                                                <div key={"depField" + index}>
                                                    <Input
                                                        data-qa='parameter-name'
                                                        style={{ marginRight: "20px" }}
                                                        value={field.key}
                                                        onChange={(e, data) => setDepKey(index, "key", data.value)}
                                                    />
                                                    <Dropdown
                                                        placeholder='Select Field'
                                                        style={{ margin: "15px auto" }}
                                                        search
                                                        selection
                                                        data-qa='name'
                                                        selectOnBlur={false}
                                                        value={field.value}
                                                        options={fields.map((item, index) => ({ text: item, value: item }))}
                                                        onChange={(e, data) => {
                                                            setDepKey(index, "value", data.value);
                                                        }}
                                                    />
                                                    <Button
                                                        data-qa='filter-remove'
                                                        className='red removeBtn'
                                                        onClick={() => {
                                                            removeDepField(index);
                                                        }}
                                                    >
                                                        X
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                onClick={() => {
                                                    setDependencyFields(dependencyFields.concat({ key: "", value: "" }));
                                                }}
                                            >
                                                Add Field
                                            </Button>
                                        </span>
                                    </GridRow>
                                    <br />
                                    <GridRow>
                                        <span className='api-names-column'>Fields to be updated by API</span>
                                        <span className='api_update_column'>
                                            {fieldsUpdated.map((field, index) => (
                                                <div key={"upField" + index}>
                                                    <Input
                                                        data-qa='update-name'
                                                        style={{ marginRight: "20px" }}
                                                        value={field.key}
                                                        onChange={(e, data) => setUpdatedKey(index, "key", data.value)}
                                                    />
                                                    <Dropdown
                                                        placeholder='Select Field'
                                                        style={{ margin: "15px auto" }}
                                                        selection
                                                        search
                                                        data-qa='update-field'
                                                        selectOnBlur={false}
                                                        value={field.value}
                                                        options={fields.map((item, index) => ({ text: item, value: item }))}
                                                        onChange={(e, data) => {
                                                            setUpdatedKey(index, "value", data.value);
                                                        }}
                                                    />
                                                    <Button
                                                        data-qa='filter-remove'
                                                        className='red removeBtn'
                                                        onClick={() => {
                                                            removeUpdatedField(index);
                                                        }}
                                                    >
                                                        X
                                                    </Button>
                                                </div>
                                            ))}
                                            <Button
                                                onClick={() => {
                                                    setFieldsUpdated(fieldsUpdated.concat({ key: "", value: "" }));
                                                }}
                                            >
                                                Add Field
                                            </Button>
                                        </span>
                                    </GridRow>
                                    <br />
                                    <GridRow>
                                        <div className='api-names-column'>API token</div> <br />
                                        <Input data-qa='token' style={{ minWidth: "600px", padding: "15px" }} onChange={(e, data) => setToken(data.value)} value={token} />
                                    </GridRow>{" "}
                                    <br />
                                    <GridRow>
                                        <div className='api-names-column'>Mode</div> <br />
                                        <Input data-qa='token' style={{ minWidth: "600px", padding: "15px" }} onChange={(e, data) => setMode(data.value)} value={mode} />
                                    </GridRow>{" "}
                                    <br />
                                    <GridRow>
                                        <div className='api-names-column'>API base url</div> <br />
                                        <Input data-qa='base_url' style={{ minWidth: "600px", padding: "15px" }} onChange={(e, data) => setBaseUrl(data.value)} value={baseUrl} />
                                    </GridRow>{" "}
                                    <br />
                                    <GridRow style={{ marginLeft: "10px" }}>
                                        <Button
                                            data-qa='cancel-validator'
                                            onClick={() => {
                                                setFields();
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            data-qa='save-validator'
                                            onClick={() => {
                                                save();
                                            }}
                                            style={{ marginLeft: "20px" }}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            data-qa='delete-validator'
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
export default ApiUpdate;
