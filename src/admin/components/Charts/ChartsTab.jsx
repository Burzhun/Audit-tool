import React, { useState, useEffect } from "react";
import { Grid, GridColumn, GridRow, Button, Select } from "semantic-ui-react";
import SortableMultiSelect from "../SortableMultiSelect";
import LabelForm from "./LabelForm";
import ComplexList from "./ComplexList";
import CreatableSelect from "react-select/creatable";

const ChartsTab = (props) => {
    const [chart, setChart] = useState(null);
    const [selectedField, setSelectedField] = useState(null);
    const [selectedFieldIndex, setSelectedFieldIndex] = useState(null);

    useEffect(() => {
        setSelectedField(null);
        if (props.config.Charts) {
            let chart1 = JSON.parse(JSON.stringify(props.config.Charts));
            if (!chart1.charting_options) chart1.charting_options = [];
            setChart(chart1);
        }
        getFieldsList();
    }, [props.config]);

    function getFieldsList() {
        var populated_fields = [];
        list = [];
        if (props.scheme) {
            if (props.config.Charts && props.config.Charts.charting_options) {
                populated_fields = props.config.Charts.charting_options.map((f) => f.ArrayFieldName.split(".")[1]);
            }
            props.scheme.fields.forEach((field) => {
                const ar = field.name.split(".");
                if (ar.length > 2 && ar[0] === "CurrentState" && ar[2] === "[]") {
                    if (!list.includes(ar[1])) list.push(ar[1]);
                    if (!populated_fields.includes(ar[1])) empty_list.push(ar[1]);
                }
            });
        }
    }

    function setChartField(name, value) {
        let new_chart = Object.assign({}, chart);
        let field_index = new_chart.charting_options.findIndex((c) => c.ArrayFieldName.indexOf("." + selectedField) > 0);
        new_chart.charting_options[field_index][name] = value;
        setChart(new_chart);
    }

    function setUpperChartField(name, value) {
        let new_chart = Object.assign({}, chart);
        new_chart[name] = value;
        setChart(new_chart);
    }

    function setSubFieldsList() {
        if (selectedField) {
            let field_index = chart ? chart.charting_options.findIndex((c) => c.ArrayFieldName.indexOf("." + selectedField) > 0) : -1;
            if (field_index !== selectedFieldIndex && field_index >= 0) setSelectedFieldIndex(field_index);
            if (field_index === -1) {
                let new_chart = chart
                    ? Object.assign({}, chart)
                    : {
                          charting_options: [],
                          DefaultFieldsToDisplayInMiniSearchResultsScreen: [],
                          MiniSearchResultsScreenSearchFieldNames: [],
                          DefaultSearchFieldsOnMiniSearchResultsScreen: [],
                          LegendLabelField: "",
                          Palette: []
                      };
                new_chart.charting_options.push({
                    ArrayFieldName: "CurrentState." + selectedField,
                    ChartType: "",
                    DefaultXaxis: "",
                    DefaultYaxis: "",
                    NonPlottableFields: [],
                    XAxisScale: "",
                    YAxisScale: ""
                });
                setChart(new_chart, () => {
                    setSubFieldsList();
                });
                return;
            }
        }
        subfields_list = [];
        if (props.scheme)
            props.scheme.fields.forEach((field) => {
                const ar = field.name.split(".");
                if (ar.length == 4 && ar[0] === "CurrentState" && ar[1] === selectedField && ar[2] === "[]") {
                    if (ar[3] !== "_id" && !subfields_list.includes(ar[3])) subfields_list.push(ar[3]);
                }
            });
    }
    function save() {
        props.updateConfg({ data: chart, field: "Charts", activeCollection: props.collection });
    }

    var list = [];
    var empty_list = [];
    var subfields_list = [];
    getFieldsList();
    setSubFieldsList();
    const fields = props.scheme
        ? props.scheme.fields
              .filter((f) => {
                  if (f.types.length > 0 && f.types[0].type === "array") return false;
                  const ar = f.name.split(".");
                  if (ar.length === 2 && (ar[0] === "CurrentState" || ar[0] === "AuditState")) return true;
                  else return false;
              })
              .map((f) => f.name)
              .concat("RecordId")
        : [];
    return (
        <React.Fragment>
            <Grid relaxed='very' columns='equal'>
                <Grid.Column>
                    <div className='charts-container fields-list' data-qa='charts-fields'>
                        {list.map((name, index) => {
                            const t = (
                                <div
                                    data-qa={name}
                                    key={name + "key" + index}
                                    onClick={() => setSelectedField(name, () => setSubFieldsList())}
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
                    {selectedField && selectedFieldIndex !== null && chart && (
                        <div className='charts-container values-list' data-qa='charts-values'>
                            <div>
                                <span className='names-column'>ChartType</span>
                                <Select
                                    style={{ minWidth: "400px" }}
                                    search
                                    options={["scatter", "line", "bar"].map((item) => ({ text: item, value: item }))}
                                    value={chart.charting_options[selectedFieldIndex]?.ChartType}
                                    data-qa='field-name'
                                    onChange={(e, data) => {
                                        setChartField("ChartType", data.value);
                                    }}
                                    className='values-column'
                                />
                            </div>
                            <div>
                                <span className='names-column'>DefaultXaxis</span>
                                <Select
                                    style={{ minWidth: "400px" }}
                                    search
                                    options={subfields_list.map((item) => ({ text: item, value: item }))}
                                    value={chart.charting_options[selectedFieldIndex].DefaultXaxis}
                                    data-qa='field-name'
                                    onChange={(e, data) => {
                                        setChartField("DefaultXaxis", data.value);
                                    }}
                                    className='values-column'
                                />
                            </div>
                            <div>
                                <span className='names-column'>DefaultYaxis</span>
                                <Select
                                    style={{ minWidth: "400px" }}
                                    search
                                    options={subfields_list.map((item) => ({ text: item, value: item }))}
                                    value={chart.charting_options[selectedFieldIndex].DefaultYaxis}
                                    data-qa='field-name'
                                    onChange={(e, data) => {
                                        setChartField("DefaultYaxis", data.value);
                                    }}
                                    className='values-column'
                                />
                            </div>
                            <div>
                                <span className='names-column'>NonPlottableFields</span>
                                <SortableMultiSelect
                                    isMulti={true}
                                    className=''
                                    styles={{ width: "300px" }}
                                    value={chart.charting_options[selectedFieldIndex].NonPlottableFields.map((f) => ({ value: f, label: f }))}
                                    onChange={(values, m) => setChartField("NonPlottableFields", values ? values.map((v) => v.label) : [])}
                                    options={subfields_list.map((f) => ({ value: f, label: f }))}
                                />
                            </div>
                            <div>
                                <span className='names-column'>XAxisScale</span>
                                <Select
                                    style={{ minWidth: "400px" }}
                                    search
                                    options={["equalDistance", "linear", "log"].map((item) => ({ text: item, value: item }))}
                                    value={chart.charting_options[selectedFieldIndex].XAxisScale}
                                    data-qa='field-name'
                                    onChange={(e, data) => {
                                        setChartField("XAxisScale", data.value);
                                    }}
                                    className='values-column'
                                />
                            </div>
                            <div>
                                <span className='names-column'>YAxisScale</span>
                                <Select
                                    style={{ minWidth: "400px" }}
                                    search
                                    options={["equalDistance", "linear", "log"].map((item) => ({ text: item, value: item }))}
                                    value={chart.charting_options[selectedFieldIndex].YAxisScale}
                                    data-qa='field-name'
                                    onChange={(e, data) => {
                                        setChartField("YAxisScale", data.value);
                                    }}
                                    className='values-column'
                                />
                            </div>
                        </div>
                    )}
                </Grid.Column>
                <GridColumn width={14}>
                    {chart && (
                        <React.Fragment>
                            <GridRow>
                                <div style={{ margin: "10px", fontWeight: "bold" }}>DefaultFieldsToDisplayInMiniSearchResultsScreen</div> <br />
                                <div style={{ display: "block", marginLeft: "10px", width: "100%" }}>
                                    <SortableMultiSelect
                                        isMulti={true}
                                        className=''
                                        styles={{ width: "300px" }}
                                        value={chart.DefaultFieldsToDisplayInMiniSearchResultsScreen.map((f) => ({ value: f, label: f }))}
                                        onChange={(values, m) => setUpperChartField("DefaultFieldsToDisplayInMiniSearchResultsScreen", values ? values.map((v) => v.label) : [])}
                                        options={fields.map((f) => ({ value: f, label: f }))}
                                    />
                                </div>
                            </GridRow>
                            <GridRow>
                                <div style={{ margin: "10px", fontWeight: "bold" }}>MiniSearchResultsScreenSearchFieldNames</div> <br />
                                <div style={{ display: "block", marginLeft: "10px", width: "100%" }}>
                                    <SortableMultiSelect
                                        isMulti={true}
                                        className=''
                                        styles={{ width: "300px" }}
                                        value={chart.MiniSearchResultsScreenSearchFieldNames.map((f) => ({ value: f, label: f }))}
                                        onChange={(values, m) => setUpperChartField("MiniSearchResultsScreenSearchFieldNames", values ? values.map((v) => v.label) : [])}
                                        options={fields.map((f) => ({ value: f, label: f }))}
                                    />
                                </div>
                            </GridRow>
                            <ComplexList data={chart.DefaultSearchFieldsOnMiniSearchResultsScreen} fields={fields} setUpperChartField={setUpperChartField} />
                            <LabelForm label={chart.LegendLabelField} fields={fields} setUpperChartField={setUpperChartField} />
                            <GridRow>
                                <div style={{ margin: "10px", fontWeight: "bold" }}>Palette</div> <br />
                                <div style={{ display: "block", marginLeft: "10px", width: "100%" }}>
                                    <CreatableSelect
                                        isMulti
                                        className=''
                                        styles={{ width: "300px" }}
                                        value={chart.Palette.map((f) => ({ value: f, label: f }))}
                                        onChange={(values, m) => setUpperChartField("Palette", values ? values.map((v) => v.label) : [])}
                                        options={chart.Palette.map((f) => ({ value: f, label: f }))}
                                    />
                                </div>
                            </GridRow>
                            <br />
                            <GridRow style={{ marginLeft: "10px" }}>
                                <Button
                                    data-qa='cancel-validator'
                                    onClick={() => {
                                        setChart(JSON.parse(JSON.stringify(props.config.Charts)));
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
                        </React.Fragment>
                    )}
                </GridColumn>
            </Grid>
        </React.Fragment>
    );
};
export default ChartsTab;
