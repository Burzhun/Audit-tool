import React from "react";
import { Grid, GridRow, GridColumn, Segment, Dropdown, SegmentGroup, Checkbox, Button, Input, Tab } from "semantic-ui-react";
import { connect } from "react-redux";
import dashboardStore from "../store/dashboard/slice";
import constants from "../store/dashboard/constants";
import SideSelect from "../components/SideSelect/SideSelect";
import "./Dashboard.scss";
import ValidatorsForm from "../components/ValidatorsForm";
import dashboard_tab_fieldlist from "../components/dashboard_tab";
import UpdatesTab from "../components/Updates/UpdatesTab";
import ChartsTab from "../components/Charts/ChartsTab";
import Sortings from "../components/Sortings";
import ConfidenceScores from "../components/ConfidenceScores";
import ApiUpdate from "../components/Updates/APIUpdate";
import SearchFieldNameForm from "../components/searchFieldNameForm";
import ComplexFieldsform from "../components/ComplexFieldsForm";
import UserFunctions from "../components/UserFunctions";
import Images from "../components/Images";
import BusinessRules from "../components/BusinessRules";
import AllowCopyFunction from "../components/AllowCopyFunction";
import CopyToText from "../components/CopyToText";
import ConfigurationForm from "../components/ConfigurationForm";
import JSONEditor from "../components/JSONEditor";
import FloatDisplayPrecision from "../components/FloatDisplayPrecision";
import AuditDropdownVisible from "../components/AuditDropdownVisible";
import AvailableRecords from "../components/AvailableRecords";
import TableSettings from "../components/TableSettings";
import ExternalUsersQuery from "../components/ExternalUsersQuery";
import ManagerAccess from "../components/ManagerAccess";
import DefaultUrl from "../components/DefaultUrl";
const { KNOWN_CONFIGURATIONS } = constants;

const prod = process.env.REACT_APP_PROD;
const enviroment = prod === "1" ? "production" : "staging";
const log_url = `https://logs.fxcompared.com/app/kibana#/discover?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-1w,to:now))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'03c199e0-a58e-11ea-93e8-cf431ad265e9',key:log_type,negate:!f,params:(query:configuration_change),type:phrase),query:(match_phrase:(log_type:configuration_change))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'03c199e0-a58e-11ea-93e8-cf431ad265e9',key:collection,negate:!f,params:(query:{collection_name}),type:phrase),query:(match_phrase:(collection:{collection_name}))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'03c199e0-a58e-11ea-93e8-cf431ad265e9',key:user_type,negate:!f,params:(query:{user_type}),type:phrase),query:(match_phrase:(user_type:{user_type}))),('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'03c199e0-a58e-11ea-93e8-cf431ad265e9',key:environment,negate:!f,params:(query:{enviroment}),type:phrase),query:(match_phrase:(environment:{enviroment})))),index:'03c199e0-a58e-11ea-93e8-cf431ad265e9',interval:auto,query:(language:kuery,query:''),sort:!(!('@timestamp',desc)))`;

const SELECT_TYPE = {
    COLLECTION: "COLLECTION",
    CONFIGURATION: "CONFIGURATION"
};
let editor_mapper = {};
editor_mapper[KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS] = {
    main: "Set uneditable fields",
    leftColumn: "Editable fields",
    rightColumn: "Uneditable fields"
};
editor_mapper[KNOWN_CONFIGURATIONS.FIELDS_TO_CREATE] = {
    main: "Set fields to create",
    leftColumn: "Unselected fields",
    rightColumn: "Selected fields"
};
editor_mapper[KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS] = {
    main: "Set undisplayable fields",
    leftColumn: "Displayable fields",
    rightColumn: "Undisplayable fields"
};
editor_mapper[KNOWN_CONFIGURATIONS.VISIBILITY] = {
    main: "Set collection visibility",
    leftColumn: "Invisible to",
    rightColumn: "Visible to"
};
editor_mapper[KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION] = {
    main: "Set new record creation",
    leftColumn: "Disallowed fields",
    rightColumn: "Allowed fields"
};
editor_mapper[KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS] = {
    main: "Set default audit session fields",
    leftColumn: "Unselected fields",
    rightColumn: "Selected fields"
};
editor_mapper[KNOWN_CONFIGURATIONS.NESTED_SEARCH_FIELDS] = {
    main: "Set nested search fields",
    leftColumn: "Unselected fields",
    rightColumn: "Selected fields"
};
editor_mapper[KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS] = {
    main: "Set middle screen fields",
    leftColumn: "Unselected fields",
    rightColumn: "Selected fields"
};
editor_mapper[KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS] = {
    main: "Set search result view default fields",
    leftColumn: "Unselected fields",
    rightColumn: "Selected fields"
};
editor_mapper[KNOWN_CONFIGURATIONS.SEARCH_FIELDS] = {
    main: "Set search fields",
    leftColumn: "Unselected fields",
    rightColumn: "Selected fields"
};

let select_mapper = {};
select_mapper[SELECT_TYPE.COLLECTION] = "activeCollection";
select_mapper[SELECT_TYPE.CONFIGURATION] = "activeConfigurationField";

let selection_component_mapper = {};
selection_component_mapper[KNOWN_CONFIGURATIONS.VISIBILITY] = (props) =>
    props.config.visible !== undefined ? (
        <Checkbox label='Private collection' data-qa='visibility' onChange={(e, data) => props.onChange(data.checked)} checked={!props.config.visible} />
    ) : null;
selection_component_mapper[KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION] = (props) => (
    <Checkbox label='Allow new record creation' onChange={(e, data) => props.onChange(data.checked)} checked={props.config.allowed} />
);
selection_component_mapper[KNOWN_CONFIGURATIONS.SEARCH_FIELDS] = (props) => (
    <Grid centered>
        <Grid.Row>
            <Grid.Column width={6}>
                <p className='label-centered'>Default search field:</p>
                <Segment className='segment-dropdown'>
                    <Dropdown
                        className='dropdown-main'
                        placeholder='Select or search field...'
                        fluid
                        search
                        clearable
                        selection
                        selectOnBlur={false}
                        options={
                            props.config.availableSearchFields
                                ? props.config.availableSearchFields.map((item) => ({
                                      text: item,
                                      value: item
                                  }))
                                : []
                        }
                        onChange={(e, data) => props.onChange(data.value)}
                        value={props.config.defaultSearchField}
                    />
                </Segment>
            </Grid.Column>
        </Grid.Row>
    </Grid>
);

let selection_change_mapper = {};
selection_change_mapper[KNOWN_CONFIGURATIONS.VISIBILITY] = (value) => ({
    visible: !value
});
selection_change_mapper[KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION] = (value) => ({
    allowed: value
});
selection_change_mapper[KNOWN_CONFIGURATIONS.SEARCH_FIELDS] = (value) => ({
    defaultSearchField: value
});

let selection_disabled_mapper = {};
selection_disabled_mapper[KNOWN_CONFIGURATIONS.VISIBILITY] = (config) => config.visible;
selection_disabled_mapper[KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION] = (config) => !config.allowed;
selection_disabled_mapper[KNOWN_CONFIGURATIONS.SEARCH_FIELDS] = () => false;

class Dashboard extends React.Component {
    static selectFieldMapper = select_mapper;

    static editorLabelsMapper = editor_mapper;

    static selectionConfigMapper = {
        component: selection_component_mapper,
        change: selection_change_mapper,
        disabled: selection_disabled_mapper
    };

    componentDidMount() {
        const { getCollectionsAndFieldsRequest } = this.props;
        getCollectionsAndFieldsRequest(this.props.user.role === "Admin" ? "internal" : "external");
    }

    onColumnsChange = (data, updated = false) => {
        const { leftColumn, rightColumn, on, imageLinks } = data;
        const { changeEditorSelection } = this.props;

        changeEditorSelection({
            unselected: leftColumn,
            selected: rightColumn,
            updated: updated,
            on,
            imageLinks
        });
    };
    onCollectionConfigurationSelect = (selectType, data) => {
        const { setActiveCollectionConfiguration } = this.props;
        const payloadField = Dashboard.selectFieldMapper[selectType];

        let conf = {
            selectType: selectType,
            newCollection: data.newCollection || false
        };
        conf[payloadField] = data.value;
        setActiveCollectionConfiguration(conf);
    };

    onConfigChange = (data) => {
        const { changeEditorSelectionConfig, activeConfigurationField } = this.props;
        const config = Dashboard.selectionConfigMapper.change[activeConfigurationField](data);
        changeEditorSelectionConfig(config);
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.userName) this.props.setUserName(this.props.userName);
        if (this.props.revision) this.props.setRevision(this.props.revision);

        if (this.props.newCollection) this.props.getCollectionsAndFieldsRequest();

        if (prevProps.activeCollection !== this.props.activeCollection && this.props.activeConfigurationField) {
            this.props.setActiveCollectionConfiguration({
                activeConfigurationField: this.props.activeConfigurationField,
                selectType: SELECT_TYPE.CONFIGURATION
            });
        }
    }

    getEditorKey = () => {
        const { activeCollection, activeConfigurationField, editorSelection, user_type } = this.props;

        const loaded = !!(editorSelection.selected.length || editorSelection.unselected.length);

        return [activeCollection, activeConfigurationField, loaded].join(".");
    };

    setUsersType = (type) => {
        this.props.setUsersType(type);
        this.props.getCollectionsAndFieldsRequest(type);
        if (this.props.activeCollection) this.onCollectionConfigurationSelect(SELECT_TYPE.CONFIGURATION, { value: this.props.activeCollection });
    };

    render() {
        const {
            collections,
            configurationFields,
            editorSelection,
            activeCollection,
            activeConfigurationField,
            isEditorTouched,
            updateConfigurationDataRequest,
            updateConfigField,
            setActiveCollectionConfiguration,
            user_type
        } = this.props;

        const isEditorActive = !!(activeCollection && activeConfigurationField);

        const ConfigComponent = Dashboard.selectionConfigMapper.component[activeConfigurationField];
        const isEditorDisabled = ConfigComponent ? Dashboard.selectionConfigMapper.disabled[activeConfigurationField](editorSelection.config) : false;
        const labels = Dashboard.editorLabelsMapper[activeConfigurationField];

        const dashboard_tab = (fields_list) => {
            if (!this.props.config) return null;
            const isTabEditorActive = isEditorActive && fields_list.includes(activeConfigurationField);
            if (activeConfigurationField === "DefaultSortings") {
                return (
                    <Sortings
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "ExternalUsersQuery") {
                return (
                    <ExternalUsersQuery
                        user={this.props.user}
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "Managers Access") {
                return (
                    <ManagerAccess
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "TableSettings") {
                return (
                    <TableSettings
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "CopyToText") {
                return (
                    <CopyToText
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "AuditDropdownVisible") {
                return (
                    <AuditDropdownVisible
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "AllowCopyFunction") {
                return (
                    <AllowCopyFunction
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "FloatDisplayPrecision") {
                return (
                    <FloatDisplayPrecision
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "ConfidenceScores") {
                return (
                    <ConfidenceScores
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "Available Records") {
                return (
                    <AvailableRecords
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }

            if (activeConfigurationField === "DefaultSearchFieldName") {
                return (
                    <SearchFieldNameForm
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "DefaultUrl") {
                return (
                    <DefaultUrl
                        collection={activeCollection}
                        config={this.props.config}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "ComplexFields") {
                return (
                    <ComplexFieldsform
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        isTabEditorActive={isTabEditorActive}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                    />
                );
            }
            if (activeConfigurationField === "user_functions") {
                return (
                    <UserFunctions
                        collection={activeCollection}
                        config={this.props.config}
                        scheme={this.props.scheme}
                        updateConfg={updateConfigField}
                        activeConfigurationField={this.props.activeConfigurationField}
                        onCollectionConfigurationSelect={this.onCollectionConfigurationSelect}
                        fields_list={fields_list}
                        user_functions={this.props.config.user_functions}
                        SELECT_TYPE={SELECT_TYPE.CONFIGURATION}
                        isTabEditorActive={isTabEditorActive}
                    />
                );
            }
            return (
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
                                    options={fields_list.map((item) => ({ text: item, value: item }))}
                                    onChange={(e, data) => this.onCollectionConfigurationSelect(SELECT_TYPE.CONFIGURATION, data)}
                                    value={activeConfigurationField}
                                />
                            </Segment>
                        </GridColumn>
                    </GridRow>

                    {isTabEditorActive ? (
                        <GridRow centered>
                            <GridColumn width={14}>
                                <SegmentGroup>
                                    <Segment textAlign='center' className='segment-group-header'>
                                        {labels.main}
                                    </Segment>
                                    <Segment>
                                        <Grid>
                                            {ConfigComponent ? (
                                                <GridRow className='checkbox-row'>
                                                    <GridColumn textAlign='center'>
                                                        <ConfigComponent onChange={this.onConfigChange} config={editorSelection.config} />
                                                    </GridColumn>
                                                </GridRow>
                                            ) : null}
                                            <GridRow>
                                                <GridColumn>
                                                    {this.props.activeConfigurationField !== "Visibility" && (
                                                        <SideSelect
                                                            disabled={isEditorDisabled}
                                                            key={this.getEditorKey()}
                                                            activeConfigurationField={this.props.activeConfigurationField}
                                                            leftColumn={{
                                                                title: labels.leftColumn,
                                                                items: editorSelection.unselected
                                                            }}
                                                            rightColumn={{
                                                                title: labels.rightColumn,
                                                                items: editorSelection.selected
                                                            }}
                                                            rightColumnSortable
                                                            onChange={this.onColumnsChange}
                                                            editorSelection={this.props.editorSelection}
                                                            scheme={this.props.scheme}
                                                        />
                                                    )}
                                                </GridColumn>
                                            </GridRow>
                                        </Grid>
                                    </Segment>
                                    <Segment textAlign='right' className='action-buttons'>
                                        <Button color='red' disabled={!isEditorTouched} onClick={setActiveCollectionConfiguration} data-qa='abort-changes'>
                                            Abort Changes
                                        </Button>
                                        <Button color='blue' disabled={!isEditorTouched} onClick={() => updateConfigurationDataRequest()} data-qa='save-changes'>
                                            Save
                                        </Button>
                                    </Segment>
                                </SegmentGroup>
                            </GridColumn>
                        </GridRow>
                    ) : null}
                </Grid>
            );
        };
        let panes = this.props.config
            ? ["Search Screen", "Audit Screen", "Images", "Charts", "User Access"].concat(this.props.user_type !== "external" ? ["API calls"] : []).map((tab_name) => {
                  const fields_list = dashboard_tab_fieldlist(tab_name, configurationFields, this.props.user_type);
                  return fields_list.length > 0 ? { menuItem: tab_name, render: () => <Tab.Pane>{dashboard_tab(fields_list)}</Tab.Pane> } : null;
              })
            : [];

        if (this.props.config) {
            panes.push({
                menuItem: "Images",
                render: () => (
                    <Tab.Pane>
                        <Images collection={activeCollection} config={this.props.config} scheme={this.props.scheme} updateConfg={updateConfigField} />
                    </Tab.Pane>
                )
            });

            panes.push({
                menuItem: "Charts",
                render: () => (
                    <Tab.Pane>
                        <ChartsTab collection={activeCollection} config={this.props.config} scheme={this.props.scheme} updateConfg={updateConfigField} />
                    </Tab.Pane>
                )
            });
            if (this.props.user_type !== "external") {
                panes.push({
                    menuItem: "Field Validation",
                    render: () => (
                        <Tab.Pane>
                            <ValidatorsForm collection={activeCollection} config={this.props.config} scheme={this.props.scheme} updateConfg={updateConfigField} />
                        </Tab.Pane>
                    )
                });

                panes.push({
                    menuItem: "Business Rules",
                    render: () => (
                        <Tab.Pane>
                            <BusinessRules collection={activeCollection} config={this.props.config} scheme={this.props.scheme} updateConfg={updateConfigField} />
                        </Tab.Pane>
                    )
                });

                panes.push({
                    menuItem: "API Calls",
                    render: () => (
                        <Tab.Pane>
                            <ApiUpdate collection={activeCollection} config={this.props.config} scheme={this.props.scheme} updateConfg={updateConfigField} user={this.props.user} />
                        </Tab.Pane>
                    )
                });

                if (this.props.config.global_automatic_updates)
                    panes.push({
                        menuItem: "Automatic Updates",
                        render: () => (
                            <Tab.Pane>
                                <UpdatesTab
                                    collection={activeCollection}
                                    config={this.props.config}
                                    scheme={this.props.scheme}
                                    updateConfg={updateConfigField}
                                    user={this.props.user}
                                />
                            </Tab.Pane>
                        )
                    });

                panes.push({
                    menuItem: "JSON",
                    render: () => (
                        <Tab.Pane>
                            <JSONEditor
                                collection={activeCollection}
                                config={this.props.config}
                                scheme={this.props.scheme}
                                updateConfg={updateConfigField}
                                user={this.props.user}
                            />
                        </Tab.Pane>
                    )
                });
            }
        }

        return (
            <React.Fragment>
                <span className='user_type_selector'>
                    Type of users
                    {this.props.user.role === "Admin" && (
                        <span onClick={() => this.setUsersType("internal")} className={this.props.user_type === "internal" ? "selected" : ""}>
                            Internal
                        </span>
                    )}
                    <span onClick={() => this.setUsersType("external")} className={this.props.user_type === "external" ? "selected" : ""}>
                        External
                    </span>
                    {this.props.config && (
                        <div className='configuration_logs_link'>
                            <a
                                target='_blank'
                                href={log_url
                                    .split("{enviroment}")
                                    .join(enviroment)
                                    .split("{collection_name}")
                                    .join(activeCollection)
                                    .split("{user_type}")
                                    .join(this.props.user_type)}
                            >
                                Logs
                            </a>
                            {this.props.config.LastUpdateBy && (
                                <div style={{ fontSize: "15px", marginTop: "12px" }}>
                                    {this.props.config.LastUpdateBy} <br />
                                    {this.props.config.LastUpdateDate}
                                </div>
                            )}
                        </div>
                    )}
                </span>
                <Segment className='segment-dropdown'>
                    <Dropdown
                        className='dropdown-collection'
                        placeholder='Select Collection...'
                        fluid
                        search
                        selection
                        selectOnBlur={false}
                        data-qa='select-collection'
                        options={collections.map((item) => ({ text: item, value: item }))}
                        onChange={(e, data) => this.onCollectionConfigurationSelect(SELECT_TYPE.COLLECTION, data)}
                        value={activeCollection}
                    />
                </Segment>
                {!this.props.config && (
                    <ConfigurationForm
                        onCollectionConfigurationSelect={(name) => {
                            this.props.setActiveCollectionConfiguration({
                                activeCollection: name,
                                newCollection: true,
                                selectType: SELECT_TYPE.COLLECTION
                            });
                        }}
                    />
                )}

                <Tab panes={panes} />
            </React.Fragment>
        );
    }
}

const {
    changeEditorSelection,
    getCollectionsAndFieldsRequest,
    setUsersType,
    setActiveCollectionConfiguration,
    updateConfigurationDataRequest,
    updateConfigField,
    changeEditorSelectionConfig
} = dashboardStore.actions;

export default connect((result) => result[[dashboardStore.name]], {
    changeEditorSelection,
    getCollectionsAndFieldsRequest,
    setActiveCollectionConfiguration,
    setUsersType,
    updateConfigurationDataRequest,
    updateConfigField,
    changeEditorSelectionConfig
})(Dashboard);
