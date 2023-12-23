import { call, put, takeLatest, all, select } from "redux-saga/effects";
import Cookies from "universal-cookie";
import jwt_decode from "jwt-decode";
import api, { setAuthToken } from "../../api/api";
import dashboardSlice from "./slice";
import constants from "./constants";
import formatDate from "../../../utils/formatDate";

const { actions } = dashboardSlice;
const { KNOWN_CONFIGURATIONS } = constants;

const get_object = {};
get_object[KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS] = api.dashboard.getEditableFields;
get_object[KNOWN_CONFIGURATIONS.FIELDS_TO_CREATE] = api.dashboard.getFieldsToCreate;
get_object[KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS] = api.dashboard.getDisplayableFields;
get_object[KNOWN_CONFIGURATIONS.VISIBILITY] = api.dashboard.getCollectionVisibility;
get_object[KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION] = api.dashboard.getCollectionRecordCreation;
get_object[KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS] = api.dashboard.getAuditSessionFields;
get_object[KNOWN_CONFIGURATIONS.NESTED_SEARCH_FIELDS] = api.dashboard.getNestedSearchFields;
get_object[KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS] = api.dashboard.getMiddleScreenFields;
get_object[KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS] = api.dashboard.getSearchResultFields;
get_object[KNOWN_CONFIGURATIONS.SEARCH_FIELDS] = api.dashboard.getSearchFields;

const update_object = {};
update_object[KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS] = api.dashboard.updateEditableFields;
update_object[KNOWN_CONFIGURATIONS.FIELDS_TO_CREATE] = api.dashboard.updateFieldsToCreate;
update_object[KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS] = api.dashboard.updateDisplayableFields;
update_object[KNOWN_CONFIGURATIONS.VISIBILITY] = api.dashboard.updateCollectionVisibility;
update_object[KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION] = api.dashboard.updateCollectionRecordCreation;
update_object[KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS] = api.dashboard.updateAuditSessionFields;
update_object[KNOWN_CONFIGURATIONS.NESTED_SEARCH_FIELDS] = api.dashboard.updateNestedSearchFields;
update_object[KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS] = api.dashboard.updateMiddleScreenFields;
update_object[KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS] = api.dashboard.updateSearchResultFields;
update_object[KNOWN_CONFIGURATIONS.SEARCH_FIELDS] = api.dashboard.updateSearchFields;
update_object[KNOWN_CONFIGURATIONS.UPDATE_CONFIG] = api.dashboard.updateConfigField;

const apiMapper = {
    get: get_object,
    update: update_object
};

const configurationDataMapperGet = {};
configurationDataMapperGet[KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS] = (data) => ({
    selected: data.uneditable,
    unselected: data.editable
});
configurationDataMapperGet[KNOWN_CONFIGURATIONS.FIELDS_TO_CREATE] = (data) => ({
    selected: data.selected,
    unselected: data.unselected,
    on: data.on,
    imageLinks: data.imageLinks
});
configurationDataMapperGet[KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS] = (data) => ({
    selected: data.undisplayable,
    unselected: data.displayable
});
configurationDataMapperGet[KNOWN_CONFIGURATIONS.VISIBILITY] = (data) => ({
    selected: data.allowedUsers,
    unselected: data.disallowedUsers,
    config: {
        visible: data.visible
    }
});
configurationDataMapperGet[KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION] = (data) => ({
    selected: data.allowedFields,
    unselected: data.disallowedFields,
    config: {
        allowed: data.allowed
    }
});
configurationDataMapperGet[KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS] = (data) => ({
    selected: data.selected,
    unselected: data.unselected
});
configurationDataMapperGet[KNOWN_CONFIGURATIONS.NESTED_SEARCH_FIELDS] = (data) => ({
    selected: data.selected,
    unselected: data.unselected
});
configurationDataMapperGet[KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS] = (data) => ({
    selected: data.selected,
    unselected: data.unselected
});
configurationDataMapperGet[KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS] = (data) => ({
    selected: data.selected,
    unselected: data.unselected
});
configurationDataMapperGet[KNOWN_CONFIGURATIONS.SEARCH_FIELDS] = (data) => ({
    selected: data.selected,
    unselected: data.unselected,
    config: {
        defaultSearchField: data.defaultSearchField,
        availableSearchFields: data.availableSearchFields
    }
});

const configurationDataMapperUpdate = {};
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS] = (data) => ({
    uneditable: data.selected
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.FIELDS_TO_CREATE] = (data) => ({
    uneditable: data.selected
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS] = (data) => ({
    undisplayable: data.selected
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.VISIBILITY] = (data) => ({
    allowedUsers: data.selected,
    visible: data.config.visible
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION] = (data) => ({
    allowedFields: data.selected,
    allowed: data.config.allowed
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS] = (data) => ({
    selected: data.selected
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.NESTED_SEARCH_FIELDS] = (data) => ({
    selected: data.selected
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS] = (data) => ({
    selected: data.selected
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS] = (data) => ({
    selected: data.selected
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.SEARCH_FIELDS] = (data) => ({
    selected: data.selected,
    defaultSearchField: data.config.defaultSearchField
});
configurationDataMapperUpdate[KNOWN_CONFIGURATIONS.UPDATE_CONFIG] = (data) => ({
    field: data.field,
    value: data.value
});
const configurationDataMapper = {
    get: configurationDataMapperGet,
    update: configurationDataMapperUpdate
};

function* getCollectionsAndFieldsSaga() {
    try {
        const { user_type } = yield select((state) => state[dashboardSlice.name]);

        const [collectionsResponse, configurationFieldsResponse] = yield all([call(api.dashboard.getCollections), call(api.dashboard.getConfigurationFields, { user_type })]);

        const { collections, userName, revision } = collectionsResponse.data;
        const { fields: configurationFields } = configurationFieldsResponse.data;
        if (!userName) window.location = "/admin/login";
        yield put(
            actions.getCollectionsAndFieldsSuccess({
                collections,
                configurationFields,
                userName,
                revision
            })
        );
    } catch (e) {
        yield put(actions.getCollectionsAndFieldsFailure());
    }
}

function* setActiveCollectionConfigurationSaga({ type, payload }) {
    try {
        const { activeCollection, activeConfigurationField, user_type } = yield select((state) => state[dashboardSlice.name]);

        const apiEndpoint = apiMapper.get[activeConfigurationField];
        if (payload.selectType && payload.selectType === "COLLECTION") {
            if (payload.activeCollection) {
                const response = yield call(api.dashboard.getConfig, { collectionName: payload.activeCollection, newCollection: payload.newCollection || false, user_type });
                const { data } = response;
                if (data.validators) data.data.Validators = data.validators;
                //if (response.newCollection) data.newCollection = true;
                yield put(actions.setConfiguration(data));
            }
            return;
        }
        const response = yield call(api.dashboard.getConfig, { collectionName: activeCollection, user_type });
        const { data } = response;
        if (data.validators) data.data.Validators = data.validators;
        yield put(actions.setConfiguration(data));

        yield put(actions.getConfigurationDataRequest());
        if (apiEndpoint) {
            const response = yield call(apiEndpoint, { collectionName: activeCollection, user_type });

            const result = configurationDataMapper.get[activeConfigurationField](response.data);
            yield put(actions.getConfigurationDataSuccess(result));
        }
    } catch (e) {
        yield put(actions.getConfigurationDataFailure());
    }
}

function* updateConfigurationDataSaga() {
    try {
        const { activeCollection, activeConfigurationField, editorSelection, user_type } = yield select((state) => state[dashboardSlice.name]);
        const apiEndpoint = apiMapper.update[activeConfigurationField];
        const data = configurationDataMapper.update[activeConfigurationField](editorSelection);

        if (editorSelection.on !== undefined) data.on = editorSelection.on;
        if (editorSelection.imageLinks !== undefined) data.imageLinks = editorSelection.imageLinks;
        yield call(apiEndpoint, { collectionName: activeCollection, user_type }, { ...data, user_type });

        yield put(actions.updateConfigurationDataSuccess());
    } catch (e) {
        yield put(actions.updateConfigurationDataFailure());
    }
}

function* updateConfigurationFieldSaga({ type, payload }) {
    try {
        const { user_type } = yield select((state) => state[dashboardSlice.name]);

        if (user_type === "internal") {
            const { user } = payload;

            const confirmed = window.confirm(`Warning!
You are about to change configuration in this collection.
Are you sure? This can have a very significant
impact on how the app and interprets data.`);

            if (!confirmed) {
                return;
            }
        }

        const response = yield call(api.dashboard.updateConfigField, { collectionName: payload.activeCollection, user_type }, { ...payload, user_type });

        if (response.data) alert("Successfully updated");
        const { data } = response;
        yield put(actions.setConfiguration(data));
    } catch (e) {
        yield put(actions.updateConfigurationDataFailure());
    }
}

function* loginUserSaga({ type, payload }) {
    const response = yield call(api.dashboard.loginUser, payload);
    const { data } = response;

    if (data.success) {
        const { token } = data;
        localStorage.setItem("jwtToken", token);
        const cookies = new Cookies();
        cookies.set("jwtToken", token);
        // Set token to Auth header
        setAuthToken(token);
        // Decode token to get user data
        const decoded = jwt_decode(token);

        window.location = "/admin";
    } else if (data.status === "PASSWORD_INCORRECT") {
        alert("PASSWORD IS INCORRECT");
    } else if (data.status === "USER_NOT_FOUND") {
        alert("USER NOT FOUND");
    } else if (data.status === "NO_ACCESS") {
        alert("Your account have not been granted access. Contact administrator to get access.");
    } else {
        alert("LOG IN FAILED");
    }
}

export default function* dashboardSaga() {
    yield takeLatest(actions.getCollectionsAndFieldsRequest, getCollectionsAndFieldsSaga);
    yield takeLatest(actions.setActiveCollectionConfiguration, setActiveCollectionConfigurationSaga);
    yield takeLatest(actions.updateConfigurationDataRequest, updateConfigurationDataSaga);
    yield takeLatest(actions.updateConfigField, updateConfigurationFieldSaga);
    yield takeLatest(actions.loginUser, loginUserSaga);
}
