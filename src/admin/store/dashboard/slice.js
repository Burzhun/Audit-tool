import { createSlice } from "@reduxjs/toolkit";

const dashboardSlice = createSlice({
    name: "dashboard",
    initialState: {
        collections: [],
        configurationFields: [],
        activeCollection: null,
        activeConfigurationField: null,
        isLoading: false,
        isEditorLoading: false,
        isEditorTouched: false,
        editorSelection: {
            config: {},
            selected: [],
            unselected: []
        }
    },
    reducers: {
        setConfiguration: (state, { payload }) => ({
            ...state,
            config: payload.data,
            userRole: payload.role,
            userName: payload.username,
            newCollection: payload.newCollection,
            scheme: payload.scheme ? payload.scheme : state.scheme
        }),
        setActiveCollectionConfiguration: (state, { payload = {} }) => ({
            ...state,
            activeCollection: payload.activeCollection != null ? payload.activeCollection : state.activeCollection,
            activeConfigurationField: payload.activeConfigurationField != null ? payload.activeConfigurationField : state.activeConfigurationField,
            isEditorTouched: false,
            editorSelection: {
                ...state.editorSelection,
                config: {},
                selected: [],
                unselected: []
            }
        }),
        getConfigurationDataRequest: (state) => ({
            ...state,
            isEditorLoading: true
        }),
        getConfigurationDataSuccess: (state, { payload }) => ({
            ...state,
            isEditorLoading: false,
            editorSelection: {
                ...state.editorSelection,
                config: { ...payload.config },
                selected: [...payload.selected],
                unselected: [...payload.unselected],
                on: payload.on,
                imageLinks: payload.imageLinks
            }
        }),
        getConfigurationDataFailure: (state) => ({
            ...state,
            isEditorLoading: false
        }),
        updateConfigurationDataRequest: (state) => ({
            ...state,
            isEditorLoading: true
        }),
        updateConfigField: (state) => ({
            ...state,
            isEditorLoading: true
        }),
        updateConfigurationDataSuccess: (state) => ({
            ...state,
            isEditorLoading: false,
            isEditorTouched: false
        }),
        updateConfigurationDataFailure: (state) => ({
            ...state,
            isEditorLoading: false
        }),
        changeEditorSelection: (state, { payload }) => ({
            ...state,
            editorSelection: {
                ...state.editorSelection,
                selected: [...payload.selected],
                unselected: [...payload.unselected],
                on: payload.on,
                imageLinks: payload.imageLinks
            },
            isEditorTouched: payload.updated === true
        }),
        changeEditorSelectionConfig: (state, { payload }) => ({
            ...state,
            editorSelection: {
                ...state.editorSelection,
                config: { ...state.editorSelection.config, ...payload }
            },
            isEditorTouched: true
        }),
        getCollectionsAndFieldsRequest: (state, type = null) => ({
            ...state,
            isLoading: true,
            user_type: type && type.payload ? type.payload : "internal"
        }),
        setUsersType: (state, user_type) => ({
            ...state,
            user_type: user_type.payload
        }),

        getCollectionsAndFieldsSuccess: (state, { payload }) => ({
            ...state,
            isLoading: false,
            collections: [...payload.collections],
            configurationFields: [...payload.configurationFields],
            userName: payload.userName,
            revision: payload.revision,
            newCollection: false
        }),
        getCollectionsAndFieldsFailure: (state) => ({
            ...state,
            isLoading: false
        }),
        loginUser: (state, { payload }) => ({
            ...state,
            isLoading: false
        })
    }
});

export default dashboardSlice;
