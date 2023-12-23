import React from "react";
import PropTypes from "prop-types";
import { Input, Select } from "semantic-ui-react";
import CustomPopup from "./CustomPopup";
import DateTime from "@nateradebaugh/react-datetime";
import "@nateradebaugh/react-datetime/scss/styles.scss";
import moment from "moment";
import "react-bootstrap-timezone-picker/dist/react-bootstrap-timezone-picker.min.css";
import MaskedInput from "react-text-mask";
import SortableMultiSelect from "./SortableMultiSelect";
import CreatableSelect from "react-select/creatable";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

require("moment-timezone");
let ready = 0;
let lastUpdateTime = new Date().getTime();
let input_value = {};
let selectedId = null;
export default class UpdateCell extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            timezone: 0,
            date: null,
            date_orig: null,
            timezone_opened: false,
            is_date_field: false,
            value: null,
            rand: Math.random().toString().substr(2, 6)
        };
        if (props.dataType === "date" || props.dataType === "isodate" || new Date(props.rowData.value).toString() !== "Invalid Date") {
            if (props.rowData["value"]) {
                this.state["date"] = moment.utc(props.rowData["value"]).format().substring(0, 19);
                this.state["is_date_field"] = true;
            }
        }
        this.setNewDate = this.setNewDate.bind(this);
        this.setValue = this.setValue.bind(this);
        this.getUsersList = this.getUsersList.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.valid !== 2 && this.props.valid === 2 && this.state.is_date_field) {
            this.setNewDate(this.state.date, null, true);
        }
    }

    static propTypes = {
        fieldName: PropTypes.string.isRequired,
        valid: PropTypes.number.isRequired,
        changedValues: PropTypes.object.isRequired,
        disabled: PropTypes.bool.isRequired,
        errors: PropTypes.object.isRequired,
        convertTime: PropTypes.func.isRequired,
        setNewValue: PropTypes.func.isRequired,
        dataType: PropTypes.string.isRequired
    };

    setNewDate(date, e, first_update = false) {
        const date1 = date;
        const start = e ? e.target.selectionStart + 1 : 0;
        const end = e ? e.target.selectionEnd + 1 : 0;
        if (e) {
            if ((e.target.selectionStart === 11 || e.target.selectionStart === 14 || e.target.selectionStart === 17) && date[e.target.selectionStart] === "0") {
                if (this.state.date_orig && this.state.date_orig[e.target.selectionStart - 2] === date[e.target.selectionStart - 2]) {
                    e.target.selectionStart += 1;
                    e.target.selectionEnd = e.target.selectionStart;
                }
            }
        }
        if (date === "") {
            this.props.setNewValue(this.props.fieldName, "");
            this.setState({ date: "", date_orig: "" });
        }
        if (typeof date === "string") {
            if (date[8] + date[9] === "00") date = date.substring(0, 9) + "1" + date.substring(10);
            if (date[5] + date[6] === "00") date = date.substring(0, 6) + "1" + date.substring(7);
            if (!moment(date).isValid()) {
                date = date.replace(/[_:]/g, "");
                if (date.replace(/-/g, "").length > 8 && moment(date).isValid() && !isNaN(Date.parse(date))) {
                    const l = date.length;
                    date = new Date(date);
                    if (l.length < 13) {
                        date = date.setUTCHours(0);
                        date = date.setHours(0);
                    }
                    date.setSeconds(0);
                } else {
                    const element_id = (this.props.isArrayCell ? "array_" : "") + "input_field_date" + this.props.fieldName.replace(/[^0-9a-zA-Z_]/g, "");
                    const t = document.querySelector("#" + element_id + "masked");
                    if (t && this.state.date) t.value = this.state.date.replace("T", " ");
                    return;
                }
            }
        }

        // date.setSeconds(0);
        let date_formated = moment(date);
        if (typeof date !== "string" && !first_update) date_formated.set({ second: 0 });
        date_formated = date_formated.format().substring(0, 19);
        // document.querySelector("#input_masked").value
        const updateFieldName = this.props.rowData.name ? this.props.rowData.name : this.props.fieldName;
        this.props.setNewValue(updateFieldName, moment.utc(date_formated).add(-this.state.timezone, "h").format());
        this.setState({ date: date_formated, date_orig: date1 });

        if (e && e.target) {
            if (this.prevCursorPos === 12 && e.target.selectionStart === 12) {
                e.target.setSelectionRange(13, 13);
                // this.prevCursorPos = 13;
            }
            if (e.target.selectionStart === 15 && this.prevCursorPos === 15) {
                e.target.setSelectionRange(16, 16);
                // this.prevCursorPos = 15;
            }
            this.prevCursorPos = e.target.selectionStart;
        }
    }

    handleKeyDown(e) {
        //console.log(String.fromCharCode(e.keyCode));
    }

    setValue(field, newValue) {
        ready++;
        if (selectedId && document.querySelector("#" + selectedId)) {
            document.querySelector("#" + selectedId).focus();
            document.querySelector("#" + selectedId).value = newValue;
        }
        setTimeout(() => {
            ready--;
            if (ready == 0) {
                this.props.setNewValue(field, newValue);
                if (selectedId && document.querySelector("#" + selectedId)) {
                    document.querySelector("#" + selectedId).focus();
                }
                //this.setState({value: null})
            }
        }, 400);
    }

    getUsersList() {
        const headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-access-token": localStorage.jwtToken,
            host: window.location.hostname
        };
        fetch(BACKEND_URL + "/auth/externalUsers", {
            method: "GET",
            headers: headers
        })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data.users) {
                    window.external_users_list = data.users.map((u) => u.RegisteredUserEmail);
                    this.setState({
                        rand: Math.random().toString().substr(2, 6)
                    });
                    this.forceUpdate();
                }
            });
    }

    render() {
        const fieldName = this.props.fieldName;
        //Full path for nested fields with index
        const updateFieldName = this.props.rowData.name ? this.props.rowData.name : fieldName;

        const field_id = this.props.field_id;
        let newValue =
            this.props.changedValues[updateFieldName] && this.props.changedValues[updateFieldName]["value"] !== undefined
                ? this.props.changedValues[updateFieldName]["value"]
                : undefined;
        const subFieldName = this.props.isArrayCell ? this.props.subFieldName : null;
        if (this.props.isArrayCell) {
            newValue =
                this.props.changedValues[updateFieldName] &&
                this.props.changedValues[updateFieldName][field_id] &&
                this.props.changedValues[updateFieldName][field_id][subFieldName]
                    ? this.props.changedValues[updateFieldName][field_id][subFieldName]["value"]
                    : "";
        }
        if (newValue === undefined && this.props.rowData["value"]) newValue = this.props.rowData["value"];

        const error_key = this.props.isArrayCell ? updateFieldName + "." + this.props.subFieldName + "." + this.props.field_id : updateFieldName;
        const validator = this.props.config.Validators.find((e) => e.name === this.props.fieldName + (this.props.isArrayCell ? "." + this.props.subFieldName : ""));
        const element_id = (this.props.isArrayCell ? "array_" : "") + "input_field_date" + fieldName.replace(/[^0-9a-zA-Z_]/g, "").replace(/\./g, "") + this.state.rand;
        if (validator && validator.type === "external_user_email") {
            if (!validator.constraints) validator.constraints = {};
            if (window.external_users_list) {
                validator.constraints.values = window.external_users_list;
            } else {
                this.getUsersList();
                return null;
            }
            validator.type = "enumerate";
            validator.constraints.multiple = false;
            validator.isbool = true;
        }
        if (validator && validator.type === "bool") {
            validator.type = "enumerate";
            if (!validator.constraints) validator.constraints = {};
            validator.constraints.values = ["True", "False"];
            validator.constraints.multiple = false;
            validator.isbool = true;
        }
        let used_options = [];
        const ar = fieldName.split(".");
        if (validator && !validator.constraints) validator.constraints = {};
        if (this.props.complexField && validator && (validator.type === "enumerate" || validator.type === "enumerate_array") && validator.constraints) {
            const subField = ar[1];
            let checked_keys = [];
            if (validator.constraints.unique) {
                this.props.data.forEach((row, index) => {
                    const changed_key = [ar[0], "index" + index, ar[1]].join(".");
                    if (updateFieldName === changed_key) return;
                    if (this.props.changedValues[changed_key] && this.props.changedValues[changed_key]["value"] !== "") {
                        used_options = used_options.concat(this.props.changedValues[changed_key]["value"]);
                        checked_keys.push(changed_key);
                    } else {
                        if (row[subField]) {
                            used_options = used_options.concat(Array.isArray(row[subField]) ? row[subField] : row[subField].split(","));
                            checked_keys.push(changed_key);
                        }
                    }
                });
                if (this.props.changedValues)
                    Object.keys(this.props.changedValues).forEach((key) => {
                        if (key.split(".").length === 3 && !checked_keys.includes(key) && key.includes(ar[0] + ".index") && key.includes("." + ar[1])) {
                            if (this.props.changedValues[key]["value"] !== "") {
                                used_options = used_options.concat(this.props.changedValues[key]["value"]);
                            }
                        }
                    });
            }
            const blocking_rules = this.props.config.BusinessRules.find((r) => r.RuleType === "BlockingValues");
            let blocking_rule = null;
            if (blocking_rules && blocking_rules.Rules.length > 0) {
                blocking_rule = blocking_rules.Rules.find((r) => r.field === "CurrentState." + this.props.fieldName && r.enabled);
            }
            if (
                blocking_rule &&
                this.props.blockedFields[this.props.fieldName] &&
                this.props.blockedFields[this.props.fieldName].index[this.props.element_index] &&
                this.props.blockedFields[this.props.fieldName].index[this.props.element_index].blocked &&
                !(newValue || []).includes(this.props.blockedFields[this.props.fieldName].value)
            ) {
                used_options = used_options.concat([blocking_rule.blockingValue]);
            }
            if (newValue) {
                if (!validator.constraints.values) validator.constraints.values = [];
                if (blocking_rule && newValue.includes(blocking_rule.blockingValue)) {
                    if (newValue.length > 1) this.props.setNewValue(updateFieldName, [blocking_rule.blockingValue]);
                    else {
                        used_options = validator.constraints.values.filter((f) => f !== blocking_rule.blockingValue);
                    }
                } else {
                    if (validator.constraints["Exclusive value"]) {
                        const ex_values = validator.constraints["Exclusive value"];
                        const exclusive_value = ex_values.find((f) => newValue.includes(f));
                        if (exclusive_value) {
                            if (newValue.length > 1) this.props.setNewValue(updateFieldName, [exclusive_value]);
                            else used_options = validator.constraints.values.filter((f) => f !== exclusive_value);
                        }
                    }
                }
            }
        }
        const currentValue = this.props.disabled ? null : newValue;
        const empty_array = [];
        let timezones = [];
        for (var i = -12; i <= 12; i++) {
            timezones.push({
                text: "UTC " + (i >= 0 ? "+ " : "") + i,
                value: i
            });
        }
        input_value = currentValue || "";
        if (selectedId && selectedId === element_id + "input2" && document.querySelector("#" + selectedId) && document.querySelector("#" + selectedId).value !== input_value) {
            document.querySelector("#" + selectedId).value = input_value;
        }
        //TODO: change data type define method
        return (
            <React.Fragment>
                {this.props.dataType === "date" || this.props.dataType === "isodate" ? (
                    <div style={{ alignItems: "center" }}>
                        <DateTime
                            className='fieldInputHidden'
                            style={{ margin: "2px 8px 0 0", minWidth: 140 }}
                            disabled={this.props.disabled}
                            onBlur={() => {
                                document.element_to_focus = null;
                            }}
                            id={element_id}
                            value={this.state.date ? (moment(this.state.date).isValid() ? new Date(this.state.date) : this.state.date_orig) : null}
                            onChange={(date) => {
                                this.setNewDate(date);
                            }}
                        />
                        <MaskedInput
                            id={element_id + "masked"}
                            disabled={this.props.disabled}
                            name={this.props.subFieldName}
                            className='fieldInput'
                            style={{ margin: "2px 8px 0 0", minWidth: 140 }}
                            onClick={() => {
                                document.querySelector("#" + element_id).click();
                                document.querySelector("#" + element_id + "masked").focus();
                            }}
                            //onKeyDown={this.handleKeyDown}
                            ref={(input) => (this.myinput = input)}
                            value={this.state.date ? (moment(this.state.date).isValid() ? moment(this.state.date).format("YYYY-MM-DD HH:mm:ss") : this.state.date_orig) : null}
                            mask={[/[0-2]/, /\d/, /\d/, /\d/, "-", /[0-1]/, /[0-9]/, "-", /[0-3]/, /\d/, " ", /[0-2]/, /[0-9]/, ":", /[0-5]/, /[0-9]/, ":", /[0-5]/, /[0-9]/]}
                            onChange={(e) => {
                                this.setNewDate(e.target.value, e);
                            }}
                        />
                        <span
                            className='array_row_timezone_selector'
                            style={{
                                marginBottom: this.state.timezone_opened && this.props.isArrayCell ? "149px" : 0,
                                display: "inline-block"
                            }}
                        >
                            <Select
                                placeholder='Set time zone'
                                className='timezone_picker'
                                disabled={this.props.disabled}
                                search
                                options={timezones}
                                name={this.props.subFieldName}
                                closeOnChange={true}
                                upward={this.props.upward}
                                onClose={() => {
                                    this.setState({ timezone_opened: false });
                                }}
                                onOpen={() => {
                                    this.setState({ timezone_opened: true });
                                }}
                                value={this.state.timezone}
                                onChange={(e, data) => {
                                    this.setState({ timezone: data.value }, () => {
                                        this.setNewDate(this.state.date);
                                    });
                                }}
                            />
                        </span>
                    </div>
                ) : (
                    <React.Fragment>
                        {validator &&
                        (validator.type === "enumerate" || validator.type === "enumerate_array" || validator.type === "text_array") &&
                        validator.DisplayDropDown !== false ? (
                            <React.Fragment>
                                {validator.type === "text_array" || validator.type === "numeric_array" ? (
                                    <CreatableSelect
                                        data-qa='new-value'
                                        placeholder='Set updated data'
                                        {...(validator.constraints.multiple && {
                                            multiple: true
                                        })}
                                        isDisabled={this.props.disabled}
                                        isMulti={true}
                                        className=''
                                        styles={{ width: "300px" }}
                                        value={(currentValue
                                            ? Array.isArray(currentValue)
                                                ? currentValue.filter((v) => typeof v === "string")
                                                : currentValue.split(",")
                                            : empty_array
                                        ).map((f) => ({ value: f, label: f }))}
                                        onChange={(values, m) =>
                                            this.props.setNewValue(
                                                updateFieldName,
                                                validator.constraints.multiple || validator.type === "text_array"
                                                    ? validator.type === "enumerate"
                                                        ? (values || []).map((v) => v.label).join(",")
                                                        : (values || []).map((v) => v.label)
                                                    : values
                                                    ? values.label
                                                    : ""
                                            )
                                        }
                                        options={(Array.isArray(validator.constraints.values) ? validator.constraints.values : (validator.constraints.values || "").split(","))
                                            .filter((f) => !used_options.includes(f) && f !== "")
                                            .map((e) => {
                                                return {
                                                    key: e,
                                                    value: e,
                                                    label: e
                                                };
                                            })}
                                        name={this.props.subFieldName}
                                        onFocus={(e) => {
                                            if (validator.type === "enumerate_array" && this.props.resize) this.props.resize(this.props.subFieldName, 400);
                                        }}
                                        onBlur={() => {
                                            if (validator.type === "enumerate_array" && this.props.resize) this.props.resize(this.props.subFieldName, -1);
                                        }}
                                    />
                                ) : (
                                    <SortableMultiSelect
                                        data-qa='new-value'
                                        placeholder='Set updated data'
                                        {...(validator.constraints.multiple && {
                                            multiple: true
                                        })}
                                        className='new-value'
                                        options={(Array.isArray(validator.constraints.values) ? validator.constraints.values : (validator.constraints.values || "").split(","))
                                            .filter((f) => !used_options.includes(f))
                                            .map((e) => {
                                                return {
                                                    key: e,
                                                    value: e,
                                                    label: e
                                                };
                                            })}
                                        name={this.props.subFieldName}
                                        menuPlacement={this.props.upward ? "top" : "bottom"}
                                        isMulti={validator.constraints.multiple}
                                        onFocus={(e) => {
                                            if (validator.type === "enumerate_array" && this.props.resize) this.props.resize(this.props.subFieldName, 400);
                                        }}
                                        onBlur={() => {
                                            if (validator.type === "enumerate_array" && this.props.resize) this.props.resize(this.props.subFieldName, -1);
                                        }}
                                        isDisabled={this.props.disabled}
                                        search
                                        value={
                                            validator.constraints.multiple
                                                ? (currentValue
                                                      ? Array.isArray(currentValue)
                                                          ? currentValue.filter((v) => typeof v === "string")
                                                          : currentValue.split(",")
                                                      : empty_array
                                                  ).map((f) => ({
                                                      value: f,
                                                      label: f
                                                  }))
                                                : {
                                                      value: currentValue,
                                                      label: currentValue
                                                  }
                                        }
                                        onChange={(values, m) =>
                                            this.props.setNewValue(
                                                updateFieldName,
                                                validator.constraints.multiple
                                                    ? validator.type === "enumerate"
                                                        ? (values || []).map((v) => v.label).join(",")
                                                        : (values || []).map((v) => v.label)
                                                    : values
                                                    ? values.label
                                                    : ""
                                            )
                                        }
                                    />
                                )}
                            </React.Fragment>
                        ) : (
                            <CustomPopup text={(newValue || "").toString()} element_id={"input_field" + fieldName}>
                                <Input
                                    data-qa='new-value'
                                    className='fieldInput'
                                    id={element_id + "input2"}
                                    key={"input_field_key2" + element_id}
                                    onBlur={() => {
                                        document.element_to_focus = null;
                                        selectedId = null;
                                    }}
                                    onFocus={() => {
                                        selectedId = element_id + "input2";
                                        if (!document.getElementById(selectedId)) {
                                            alert("UpdateCell error");
                                            console.error("UpdateCell error");
                                            return;
                                        }
                                        input_value = document.getElementById(selectedId).value;
                                    }}
                                    maxLength={validator && validator.type == "numeric" ? 10 : 1000}
                                    name={this.props.subFieldName}
                                    onChange={(e) => this.setValue(updateFieldName, e.target.value)}
                                    disabled={this.props.disabled}
                                />
                            </CustomPopup>
                        )}
                    </React.Fragment>
                )}
                <div
                    id={
                        (updateFieldName + (this.props.subFieldName ? "." + this.props.field_id + "." + this.props.subFieldName : ""))
                            .replace(/\./g, "_")
                            .replace(/[^0-9a-z]/g, "") + "_value"
                    }
                    style={{ display: "none" }}
                >
                    {newValue || newValue === 0 ? newValue.toString() : this.props.currentData || this.props.currentData === 0 ? this.props.currentData : ""}
                </div>
                <div name={this.props.subFieldName} className={this.props.errors[error_key] ? "error_message" : ""} style={{ color: "#ff0000" }}>
                    {this.props.errors[error_key] && Array.isArray(this.props.errors[error_key]) ? this.props.errors[error_key].map((item) => `${item};\n`) : ""}
                </div>
            </React.Fragment>
        );
    }
}
