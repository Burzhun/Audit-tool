import React, { Component } from "react";
import { connect } from "react-redux";
import { getConfig, saveData, copyRecord, getRecord } from "../../actions";
import "./detailDialog.scss";
import SplitterLayout from "react-splitter-layout";
import "react-splitter-layout/lib/index.css";
import LeftPanel from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";
import FileContext from "./components/FileContext";
import MiddleScreen from "./components/MiddleScreen";
import ErrorBoundary from "./ErrorBoundary";

class Detail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            original_data: {},
            selectedArrayField: null,
            show_fields: false,
            isUpdating: false,
            config: null,
            view: !localStorage.view || localStorage.view === "default" ? "default" : "personal"
        };
        this.selectedArrayField = this.selectedArrayField.bind(this);
    }

    componentDidMount() {
        if (this.props.isAuthenticated === false) {
            this.props.history.push("/");
        }
        this.props.getConfig();
        this.props.getDataByFirmID();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.data !== prevProps.data && this.props.data[0]) {
            // console.log(this.props.data[0].CurrentState.ImageLinks);
            this.setState({ original_data: this.props.data[0].CurrentState, isUpdating: false });
        }
        if (this.props.config !== prevProps.config) {
            // console.log(this.props.data[0].CurrentState.ImageLinks);
            const config = { ...this.props.config };

            if (
                this.state.view === "personal" &&
                config.user_config &&
                config.user_config.DefaultFieldsToDisplayInAuditSession &&
                config.user_config.DefaultFieldsToDisplayInAuditSession.length > 0
            ) {
                config.OriginalDefaultFieldsToDisplayInAuditSession = config.DefaultFieldsToDisplayInAuditSession;
                config._DefaultFieldsToDisplayInAuditSession = [...config.DefaultFieldsToDisplayInAuditSession];
                config.DefaultFieldsToDisplayInAuditSession = config.user_config.DefaultFieldsToDisplayInAuditSession;
                if (config.user_config.table_column_sizes) {
                    let configs = (config.table_column_sizes || []).slice(0);
                    config.user_config.table_column_sizes.forEach((size) => {
                        const i = configs.findIndex((c) => c.key === size.key);
                        if (i >= 0) configs[i].value = size.value;
                        else configs.push(size);
                    });
                    config.table_column_sizes = configs;
                }
            } else {
                config._DefaultFieldsToDisplayInAuditSession = [...config.DefaultFieldsToDisplayInAuditSession];
            }
            this.setState({ config });
        }
        this.updateFooterSize();
    }

    setPersonalConfig() {
        this.setState({ view: "personal" });
        const config = { ...this.props.config };
        if (config.user_config && config.user_config.DefaultFieldsToDisplayInAuditSession && config.user_config.DefaultFieldsToDisplayInAuditSession.length > 0) {
            config.OriginalDefaultFieldsToDisplayInAuditSession = config.DefaultFieldsToDisplayInAuditSession;
            config._DefaultFieldsToDisplayInAuditSession = [...config.DefaultFieldsToDisplayInAuditSession];
            config.DefaultFieldsToDisplayInAuditSession = config.user_config.DefaultFieldsToDisplayInAuditSession;
            if (config.user_config.table_column_sizes) {
                let configs = (config.table_column_sizes || []).slice(0);
                config.user_config.table_column_sizes.forEach((size) => {
                    const i = configs.findIndex((c) => c.key === size.key);
                    if (i >= 0) configs[i].value = size.value;
                    else configs.push(size);
                });
                config.table_column_sizes = configs;
            }
            this.setState({ config });
        }
    }

    selectedArrayField(field) {
        this.setState({ selectedArrayField: field });
    }

    updateFooterSize() {
        const table = document.querySelector(".auditTable");
        if (!table) return;
        const footer = document.querySelector(".footer");
        const width = table.offsetWidth;
        footer.style.width = `${width}px`;
        const marginBottom = footer.offsetHeight + 5;
        table.style["margin-bottom"] = `${marginBottom}px`;
    }

    render() {
        const { original_data } = this.state;
        const { RecordId, firmId, collectionName } = this.props.match.params;
        const { config } = this.state;
        const image_data = {
            RecordId,
            FirmIdNumber: firmId,
            original_data,
            collectionName,
            config,
            user: this.props.user,
            selectedArrayField: this.state.selectedArrayField,
            setSelectedArrayField: this.selectedArrayField,
            random: Math.floor(Math.random() * 100)
        };
        if (!this.state.isUpdating && this.props.found === false) {
            return <div>Record not found</div>;
        }
        return (
            <ErrorBoundary>
                <FileContext.Provider value={image_data}>
                    <SplitterLayout
                        secondaryInitialSize={50}
                        percentage
                        onDragEnd={() => {
                            this.updateFooterSize();
                        }}
                        panes={{ scrollable: false }}
                    >
                        <SplitterLayout secondaryInitialSize={30} percentage>
                            <LeftPanel
                                data={this.props.data}
                                config={config}
                                schema={this.props.schema}
                                RecordId={RecordId}
                                firmId={firmId}
                                collectionName={collectionName}
                                user={this.props.user}
                                isAuthenticated={this.props.isAuthenticated}
                                history={this.props.history}
                                saveData={(data) => {
                                    this.setState({ isUpdating: true });
                                    this.props.saveData(data);
                                }}
                                getConfig={this.props.getConfig}
                                getDataByFirmID={this.props.getDataByFirmID}
                                copyRecord={this.props.copyRecord}
                                setDefaultConfig={(default1 = true) => {
                                    if (default1) this.setState({ config: this.props.config, view: "default" });
                                    else this.setPersonalConfig();
                                }}
                                show_fields_button={!this.state.show_fields}
                                isUpdating={this.state.isUpdating}
                                show_fields={() => {
                                    this.setState({ show_fields: true });
                                }}
                            />
                            {this.state.show_fields && this.props.config.FieldsToDisplayOnMiddleScreen && (
                                <MiddleScreen
                                    data={this.props.data[0]}
                                    fields={this.props.config.FieldsToDisplayOnMiddleScreen}
                                    hideFileds={() => {
                                        this.setState({ show_fields: false });
                                    }}
                                />
                            )}
                        </SplitterLayout>

                        {this.props.config.DisplayImages && config && <RightPanel ImageLinks={original_data.ImageLinks} config={config} data={this.props.data[0]} />}
                    </SplitterLayout>
                </FileContext.Provider>
            </ErrorBoundary>
        );
    }
}

const mapStateToProps = (state) => ({
    user: state.authReducer.user,
    isAuthenticated: state.authReducer.isAuthenticated,
    data: state.dataReducer.data,
    found: state.dataReducer.found,
    schema: state.dataReducer.schema,
    config: state.dataReducer.config,
    collectionName: state.dataReducer.collectionName,
    dataChanged: state.dataReducer.dataChanged
});

const mapDispatchToProps = (dispatch, ownProps) => {
    const { firmId } = ownProps.match.params;
    const recordID = ownProps.match.params.RecordId;
    const { collectionName } = ownProps.match.params;
    return {
        getDataByFirmID: () => dispatch(getRecord(recordID, collectionName)),
        copyRecord: (UserName) => dispatch(copyRecord(firmId, recordID, collectionName, UserName)),
        getConfig: () => dispatch(getConfig(collectionName)),
        saveData: (data) => dispatch(saveData(data))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(Detail);
