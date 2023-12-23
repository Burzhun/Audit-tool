import React, { useState, useEffect } from "react";
import { Grid, GridRow, GridColumn, Dropdown, Segment, SegmentGroup, Button, Checkbox, Input } from "semantic-ui-react";

const DefaultUrl = (props) => {
    const [on, setOn] = useState(false);
    const [url, setUrl] = useState("");

    useEffect(() => {
        setFields();
    }, [props.config]);

    function setFields() {
        if (props.config && props.config.DefaultUrl) {
            setOn(props.config.DefaultUrl.on === true);
            setUrl(props.config.DefaultUrl.url || "");
        } else {
            setOn(false);
            setUrl("");
        }
    }

    function save() {
        const s = "?config=" + props.collection + "&";
        if (url.includes(s) || !url.includes("?config=")) {
            let new_url = url.includes(s) ? url.split(s)[1] : url;
            if (new_url.includes("&fields=")) new_url = new_url.split("&fields=")[0];
            props.updateConfg({ data: { url: new_url, on }, field: "DefaultUrl", activeCollection: props.collection });
        } else {
            alert("You entered incorrect url");
        }
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
                        Set Default Search Url
                    </Segment>
                    <Segment>
                        <Grid relaxed='very' columns='equal'>
                            <Grid.Column>
                                <GridRow>
                                    <span className='score-names-column'>Use default values</span>
                                    <span className='scoretext_column'>
                                        <Checkbox style={{ minWidth: "600px" }} onChange={(e, data) => setOn(data.checked)} checked={on} />
                                    </span>
                                </GridRow>{" "}
                                <br />
                                <GridRow>
                                    <span className='score-names-column'>Url</span>
                                    <span className='scoretext_column'>
                                        <Input style={{ minWidth: "600px" }} onChange={(e, data) => setUrl(data.value)} value={url} />
                                        <div style={{ marginTop: "10px" }}>
                                            {decodeURI(url)
                                                .split("&")
                                                .filter((f) => !f.includes("?config="))
                                                .join(" & ")}
                                        </div>
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

export default DefaultUrl;
