import React, { useState, useEffect } from "react";
import { Grid, GridRow, GridColumn, Dropdown, Segment, SegmentGroup, Input, Button, Checkbox } from "semantic-ui-react";

const ConfidenceScores = (props) => {
    const [conf, setConf] = useState(null);
    const [required, setRequired] = useState(null);
    const [scoreText, setScoreText] = useState("");
    const [noteText, setNoteText] = useState("");
    const [options, setOptions] = useState([]);

    useEffect(() => {
        if (props.config.ConfidenceScores) {
            setConf(props.config.ConfidenceScores);
        } else {
            setConf({
                DisplayScoreText: "",
                DisplayNoteText: "",
                ConfidenceScoreOptions: {}
            });
        }
    }, [props.config]);

    useEffect(() => {
        if (conf) {
            setFields();
        }
    }, [conf]);

    function setFields() {
        let depFields = {};
        setOptions(Object.keys(conf.ConfidenceScoreOptions).map((f) => ({ key: f, value: conf.ConfidenceScoreOptions[f] })));
        setScoreText(conf.DisplayScoreText);
        setNoteText(conf.DisplayNoteText);
        setRequired(props.config.ConfidenceScoreRequired !== undefined ? props.config.ConfidenceScoreRequired : false);
    }

    function setOpKey(index, key, value) {
        let fields = options.slice(0);
        fields[index][key] = value;
        setOptions(fields);
    }

    const removeOpField = (index) => {
        let fields = options.slice(0);
        fields.splice(index, 1);
        setOptions(fields);
    };

    function save() {
        let new_data = {};
        new_data["DisplayScoreText"] = scoreText;
        new_data["DisplayNoteText"] = noteText;
        console.log(options);
        new_data["ConfidenceScoreOptions"] =
            options &&
            options.length &&
            Object.assign(
                ...options.map((v) => {
                    var t = {};
                    t[v.key] = parseInt(v.value);
                    return t;
                })
            );
        props.updateConfg({ data: { options: new_data, required: required }, field: "ConfidenceScores", activeCollection: props.collection });
    }

    return (
        <React.Fragment>
            <Grid className='dashboard'>
                <GridRow centered>
                    <GridColumn width={7}>
                        <Segment className='segment-dropdown'>
                            <Dropdown
                                className='dropdown-main'
                                placeholder='Select Config Field...'
                                data-qa='select-config-field'
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
                    <Segment textAlign='center' style={{ width: "100%" }}>
                        Set Confidence Scores
                    </Segment>
                    <Segment>
                        <Grid relaxed='very' columns='equal'>
                            <Grid.Column>
                                <GridRow>
                                    <span className='score-names-column'>Confidence Score Required</span>
                                    <span className='scoretext_column'>
                                        <Checkbox style={{ minWidth: "600px" }} onChange={(e, data) => setRequired(data.checked)} checked={required} />
                                    </span>
                                </GridRow>{" "}
                                <br />
                                <GridRow>
                                    <span className='score-names-column'>DisplayScoreText</span>
                                    <span className='scoretext_column'>
                                        <Input value={scoreText} onChange={(e, data) => setScoreText(data.value)} />
                                    </span>
                                </GridRow>
                                <br />
                                <GridRow>
                                    <span className='score-names-column'>DisplayNoteText</span>
                                    <span className='scoretext_column'>
                                        <Input value={noteText} onChange={(e, data) => setNoteText(data.value)} />
                                    </span>
                                </GridRow>
                                <br />
                                <GridRow>
                                    <span className='score-names-column'>ConfidenceScoreOptions</span>
                                    <span className='confidence_update_column'>
                                        {options.length > 0 && (
                                            <div style={{ fontSize: "16px" }}>
                                                <span>Displayed Option</span>
                                                <span style={{ marginLeft: "155px" }}>Option Code</span>
                                            </div>
                                        )}
                                        {options.map((field, index) => (
                                            <div key={"depField" + index} style={{ marginBottom: "10px" }}>
                                                <Input style={{ marginRight: "20px" }} value={field.key} onChange={(e, data) => setOpKey(index, "key", data.value)} />
                                                <Input style={{ marginRight: "20px" }} value={field.value} onChange={(e, data) => setOpKey(index, "value", data.value)} />
                                                <Button
                                                    data-qa='filter-remove'
                                                    className='red removeBtn'
                                                    onClick={() => {
                                                        removeOpField(index);
                                                    }}
                                                >
                                                    X
                                                </Button>
                                            </div>
                                        ))}
                                        <Button
                                            onClick={() => {
                                                setOptions(options.concat({ key: "", value: "" }));
                                            }}
                                        >
                                            Add Field
                                        </Button>
                                    </span>
                                </GridRow>
                                <br />
                            </Grid.Column>
                            <br />
                            <GridRow style={{ marginLeft: "30px" }}>
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
                            </GridRow>
                        </Grid>
                    </Segment>
                </SegmentGroup>
            )}
        </React.Fragment>
    );
};

export default ConfidenceScores;
