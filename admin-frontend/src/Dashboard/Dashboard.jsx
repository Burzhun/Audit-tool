import React from 'react';
import {
  Grid,
  GridRow,
  GridColumn,
  Segment,
  Dropdown,
  SegmentGroup,
  Checkbox,
  Button,
  Tab
} from 'semantic-ui-react';
import { connect } from 'react-redux';
import dashboardStore from '../store/dashboard/slice';
import constants from '../store/dashboard/constants';
import SideSelect from '../components/SideSelect/SideSelect';
import './Dashboard.scss';
import ValidatorsForm from '../components/ValidatorsForm';
import dashboard_tab_fieldlist from '../components/dashboard_tab';
const { KNOWN_CONFIGURATIONS } = constants;

const SELECT_TYPE = {
  COLLECTION: 'COLLECTION',
  CONFIGURATION: 'CONFIGURATION',
};

class Dashboard extends React.Component {
  static selectFieldMapper = {
    [SELECT_TYPE.COLLECTION]: 'activeCollection',
    [SELECT_TYPE.CONFIGURATION]: 'activeConfigurationField',
  };

  static editorLabelsMapper = {
    [KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS]: {
      main: 'Set uneditable fields',
      leftColumn: 'Uneditable fields',
      rightColumn: 'Editable fields',
    },
    [KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS]: {
      main: 'Set undisplayable fields',
      leftColumn: 'Displayable fields',
      rightColumn: 'Undisplayable fields',
    },
    [KNOWN_CONFIGURATIONS.VISIBILITY]: {
      main: 'Set collection visibility',
      leftColumn: 'Invisible to',
      rightColumn: 'Visible to',
    },
    [KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION]: {
      main: 'Set new record creation',
      leftColumn: 'Disallowed fields',
      rightColumn: 'Allowed fields',
    },
    [KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS]: {
      main: 'Set default audit session fields',
      leftColumn: 'Unselected fields',
      rightColumn: 'Selected fields',
    },
    [KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS]: {
      main: 'Set middle screen fields',
      leftColumn: 'Unselected fields',
      rightColumn: 'Selected fields',
    },
    [KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS]: {
      main: 'Set search result view default fields',
      leftColumn: 'Unselected fields',
      rightColumn: 'Selected fields',
    },
    [KNOWN_CONFIGURATIONS.SEARCH_FIELDS]: {
      main: 'Set search fields',
      leftColumn: 'Unselected fields',
      rightColumn: 'Selected fields',
    },
  };

  static selectionConfigMapper = {
    component: {
      [KNOWN_CONFIGURATIONS.VISIBILITY]: (props) => (
        <Checkbox
          label="Private collection"
          data-qa="visibility"
          onChange={(e, data) => props.onChange(data.checked)}
          checked={!props.config.visible}
        />
      ),
      [KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION]: (props) => (
        <Checkbox
          label="Allow new record creation"
          onChange={(e, data) => props.onChange(data.checked)}
          checked={props.config.allowed}
        />
      ),
      [KNOWN_CONFIGURATIONS.SEARCH_FIELDS]: (props) => (
        <Grid centered>
          <Grid.Row>
            <Grid.Column width={6}>
              <p className="label-centered">Default search field:</p>
              <Segment className="segment-dropdown">
                <Dropdown
                  className="dropdown-main"
                  placeholder="Select or search field..."
                  fluid
                  search
                  clearable
                  selection
                  selectOnBlur={false}
                  options={
                    props.config.availableSearchFields
                      ? props.config.availableSearchFields.map((item) => ({
                        text: item,
                        value: item,
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
      ),
    },
    change: {
      [KNOWN_CONFIGURATIONS.VISIBILITY]: (value) => ({
        visible: !value,
      }),
      [KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION]: (value) => ({
        allowed: value,
      }),
      [KNOWN_CONFIGURATIONS.SEARCH_FIELDS]: (value) => ({
        defaultSearchField: value,
      }),
    },
    disabled: {
      [KNOWN_CONFIGURATIONS.VISIBILITY]: (config) => config.visible,
      [KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION]: (config) => !config.allowed,
      [KNOWN_CONFIGURATIONS.SEARCH_FIELDS]: () => false,
    },
  };

  componentDidMount() {
    const { getCollectionsAndFieldsRequest } = this.props;
    getCollectionsAndFieldsRequest();
  }

  onColumnsChange = (data) => {
    const { leftColumn, rightColumn } = data;
    const { changeEditorSelection } = this.props;

    changeEditorSelection({
      unselected: leftColumn,
      selected: rightColumn,
    });
  };

  onCollectionConfigurationSelect = (selectType, data) => {
    const { setActiveCollectionConfiguration } = this.props;
    const payloadField = Dashboard.selectFieldMapper[selectType];

    setActiveCollectionConfiguration({
      [payloadField]: data.value,
    });
  };

  onConfigChange = (data) => {
    const { changeEditorSelectionConfig, activeConfigurationField } = this.props;
    const config = Dashboard
      .selectionConfigMapper
      .change[activeConfigurationField](data);
    changeEditorSelectionConfig(config);
  };

  componentDidUpdate(){
    if(this.props.userName) this.props.setUserName(this.props.userName);
  }

  getEditorKey = () => {
    const {
      activeCollection,
      activeConfigurationField,
      editorSelection,
    } = this.props;

    const loaded = !!(
      editorSelection.selected.length ||
      editorSelection.unselected.length
    );

    return [
      activeCollection,
      activeConfigurationField,
      loaded,
    ].join('.');
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
    } = this.props;

    const isEditorActive = !!(
      activeCollection &&
      activeConfigurationField
    );

    const ConfigComponent = Dashboard
      .selectionConfigMapper
      .component[activeConfigurationField];
    const isEditorDisabled = ConfigComponent
      ? Dashboard
        .selectionConfigMapper
        .disabled[activeConfigurationField](editorSelection.config)
      : false;
    const labels = Dashboard
      .editorLabelsMapper[activeConfigurationField];

    const dashboard_tab = (fields_list) => {
      const isTabEditorActive = isEditorActive && fields_list.includes(activeConfigurationField);
      return  (
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
                  options={
                    fields_list.map((item) => ({ text: item, value: item }))
                  }
                  onChange={
                    (e, data) => this.onCollectionConfigurationSelect(
                      SELECT_TYPE.CONFIGURATION,
                      data,
                    )
                  }
                  value={activeConfigurationField}
                />
              </Segment>
            </GridColumn>
          </GridRow>
          {isTabEditorActive ? (
            <GridRow centered>
              <GridColumn width={14}>
                <SegmentGroup>
                  <Segment textAlign="center" className="segment-group-header">
                    {labels.main}
                  </Segment>
                  <Segment>
                    <Grid>
                      {ConfigComponent ? (
                        <GridRow className="checkbox-row">
                          <GridColumn textAlign="center">
                            <ConfigComponent
                              onChange={this.onConfigChange}
                              config={editorSelection.config}
                            />
                          </GridColumn>
                        </GridRow>
                      ) : null}
                      <GridRow>
                        <GridColumn>
                          <SideSelect
                            disabled={isEditorDisabled}
                            key={this.getEditorKey()}
                            leftColumn={{
                              title: labels.leftColumn,
                              items: editorSelection.unselected,
                            }}
                            rightColumn={{
                              title: labels.rightColumn,
                              items: editorSelection.selected,
                            }}
                            rightColumnSortable
                            onChange={this.onColumnsChange}
                          />
                        </GridColumn>
                      </GridRow>
                    </Grid>
                  </Segment>
                  <Segment textAlign="right" className="action-buttons">
                    <Button
                      color="red"
                      disabled={!isEditorTouched}
                      onClick={setActiveCollectionConfiguration}
                    >
                      Abort Changes
                    </Button>
                    <Button
                      color="blue"
                      disabled={!isEditorTouched}
                      onClick={updateConfigurationDataRequest}
                    >
                      Save
                    </Button>
                  </Segment>
                </SegmentGroup>
              </GridColumn>
            </GridRow>
          ) : null}
        </Grid> 
    )}
    let panes = ['Search Screen','Audit Screen','Images','Charts','API calls','Automatic Updates','User Access'].map(tab_name=>{
      const fields_list = dashboard_tab_fieldlist(tab_name, configurationFields);
      return fields_list.length>0 ? 
        { menuItem: tab_name, render: () => <Tab.Pane>          
            {dashboard_tab(fields_list)}
        </Tab.Pane>} : null;
    });  
    
    if(this.props.config) panes.push({ menuItem: 'Field Validation', render: () => <Tab.Pane><ValidatorsForm 
      collection={activeCollection} config={this.props.config} scheme={this.props.scheme} updateConfg={updateConfigField}  />
      </Tab.Pane> });
    
    return(
      <React.Fragment>
        <Segment className="segment-dropdown">
          <Dropdown
            className="dropdown-main"
            placeholder="Select Collection..."
            fluid
            search
            selection
            selectOnBlur={false}
            data-qa="select-collection"
            options={
              collections.map((item) => ({ text: item, value: item }))
            }
            onChange={
              (e, data) => this.onCollectionConfigurationSelect(
                SELECT_TYPE.COLLECTION,
                data,
              )
            }
            value={activeCollection}
          />
        </Segment>
        <Tab panes={panes} />
      </React.Fragment>
    )
  }
}

const {
  changeEditorSelection,
  getCollectionsAndFieldsRequest,
  setActiveCollectionConfiguration,
  updateConfigurationDataRequest,
  updateConfigField, 
  changeEditorSelectionConfig,
} = dashboardStore.actions;

export default connect(
  ({
    [dashboardStore.name]: {
      config,
      scheme,
      userRole,
      userName,
      collections,
      configurationFields,
      editorSelection,
      activeCollection,
      activeConfigurationField,
      isEditorTouched,
    },
  }) => ({
    config,
    scheme,
    userRole,
    userName,
    collections,
    configurationFields,
    editorSelection,
    activeCollection,
    activeConfigurationField,
    isEditorTouched,
  }),
  {
    changeEditorSelection,
    getCollectionsAndFieldsRequest,
    setActiveCollectionConfiguration,
    updateConfigurationDataRequest,
    updateConfigField,
    changeEditorSelectionConfig,
  },
)(Dashboard);
