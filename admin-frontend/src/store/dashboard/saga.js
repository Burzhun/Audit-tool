import {
  call,
  put,
  takeLatest,
  all,
  select,
} from 'redux-saga/effects';
import api, {setAuthToken} from '../../api/api';
import dashboardSlice from './slice';
import constants from './constants';
import Cookies from 'universal-cookie';

import jwt_decode from 'jwt-decode';

const { actions } = dashboardSlice;
const { KNOWN_CONFIGURATIONS } = constants;

const apiMapper = {
  get: {
    [KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS]: api.dashboard.getEditableFields,
    [KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS]: api.dashboard.getDisplayableFields,
    [KNOWN_CONFIGURATIONS.VISIBILITY]: api.dashboard.getCollectionVisibility,
    [KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION]: api.dashboard.getCollectionRecordCreation,
    [KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS]: api.dashboard.getAuditSessionFields,
    [KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS]: api.dashboard.getMiddleScreenFields,
    [KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS]: api.dashboard.getSearchResultFields,
    [KNOWN_CONFIGURATIONS.SEARCH_FIELDS]: api.dashboard.getSearchFields,
  },
  update: {
    [KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS]: api.dashboard.updateEditableFields,
    [KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS]: api.dashboard.updateDisplayableFields,
    [KNOWN_CONFIGURATIONS.VISIBILITY]: api.dashboard.updateCollectionVisibility,
    [KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION]: api.dashboard.updateCollectionRecordCreation,
    [KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS]: api.dashboard.updateAuditSessionFields,
    [KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS]: api.dashboard.updateMiddleScreenFields,
    [KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS]: api.dashboard.updateSearchResultFields,
    [KNOWN_CONFIGURATIONS.SEARCH_FIELDS]: api.dashboard.updateSearchFields,
    [KNOWN_CONFIGURATIONS.UPDATE_CONFIG]: api.dashboard.updateConfigField,
  },
};

const configurationDataMapper = {
  get: {
    [KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS]: (data) => ({
      selected: data.uneditable,
      unselected: data.editable,
    }),
    [KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS]: (data) => ({
      selected: data.undisplayable,
      unselected: data.displayable,
    }),
    [KNOWN_CONFIGURATIONS.VISIBILITY]: (data) => ({
      selected: data.allowedUsers,
      unselected: data.disallowedUsers,
      config: {
        visible: data.visible,
      },
    }),
    [KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION]: (data) => ({
      selected: data.allowedFields,
      unselected: data.disallowedFields,
      config: {
        allowed: data.allowed,
      },
    }),
    [KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS]: (data) => ({
      selected: data.selected,
      unselected: data.unselected,
    }),
    [KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS]: (data) => ({
      selected: data.selected,
      unselected: data.unselected,
    }),
    [KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS]: (data) => ({
      selected: data.selected,
      unselected: data.unselected,
    }),
    [KNOWN_CONFIGURATIONS.SEARCH_FIELDS]: (data) => ({
      selected: data.selected,
      unselected: data.unselected,
      config: {
        defaultSearchField: data.defaultSearchField,
        availableSearchFields: data.availableSearchFields,
      },
    }),
  },
  update: {
    [KNOWN_CONFIGURATIONS.UNEDITABLE_FIELDS]: (data) => ({
      uneditable: data.selected,
    }),
    [KNOWN_CONFIGURATIONS.UNDISPLAYABLE_FIELDS]: (data) => ({
      undisplayable: data.selected,
    }),
    [KNOWN_CONFIGURATIONS.VISIBILITY]: (data) => ({
      allowedUsers: data.selected,
      visible: data.config.visible,
    }),
    [KNOWN_CONFIGURATIONS.ALLOW_NEW_RECORD_CREATION]: (data) => ({
      allowedFields: data.selected,
      allowed: data.config.allowed,
    }),
    [KNOWN_CONFIGURATIONS.AUDIT_SESSION_FIELDS]: (data) => ({
      selected: data.selected,
    }),
    [KNOWN_CONFIGURATIONS.MIDDLE_SCREEN_FIELDS]: (data) => ({
      selected: data.selected,
    }),
    [KNOWN_CONFIGURATIONS.SEARCH_RESULT_FIELDS]: (data) => ({
      selected: data.selected,
    }),
    [KNOWN_CONFIGURATIONS.SEARCH_FIELDS]: (data) => ({
      selected: data.selected,
      defaultSearchField: data.config.defaultSearchField,
    }),
    [KNOWN_CONFIGURATIONS.UPDATE_CONFIG]: (data) => ({
      field: data.field,
      value: data.value,
    }),
  },
};

function* getCollectionsAndFieldsSaga() {
  try {
    const [collectionsResponse, configurationFieldsResponse] = yield all([
      call(api.dashboard.getCollections),
      call(api.dashboard.getConfigurationFields),
    ]);
    console.log(collectionsResponse);
    const { collections, userName } = collectionsResponse.data;
    const { fields: configurationFields } = configurationFieldsResponse.data;
    if(!userName ) window.location='login';
    yield put(actions.getCollectionsAndFieldsSuccess({
      collections,
      configurationFields,
      userName
    }));
  } catch (e) {
    yield put(actions.getCollectionsAndFieldsFailure());
  }
}

function* setActiveCollectionConfigurationSaga({type, payload}) {
  try {
    const {
      activeCollection,
      activeConfigurationField,
    } = yield select((state) => state[dashboardSlice.name]);
    const apiEndpoint = apiMapper.get[activeConfigurationField];
    
    if (!activeCollection || !activeConfigurationField || !apiEndpoint){
      if(payload.activeCollection){
        const response = yield call(
          api.dashboard.getConfig,
          { collectionName: payload.activeCollection },
        );
        yield put(actions.setConfiguration(response.data));
      }
      return;
    }
    yield put(actions.getConfigurationDataRequest());

    const response = yield call(
      apiEndpoint,
      { collectionName: activeCollection },
    );

    const result = configurationDataMapper
      .get[activeConfigurationField](response.data);
      
    yield put(actions.getConfigurationDataSuccess(result));
  } catch (e) {
    yield put(actions.getConfigurationDataFailure());
  }
}

function* updateConfigurationDataSaga() {
  try {
    const {
      activeCollection,
      activeConfigurationField,
      editorSelection,
    } = yield select((state) => state[dashboardSlice.name]);

    const apiEndpoint = apiMapper.update[activeConfigurationField];
    const data = configurationDataMapper
      .update[activeConfigurationField](editorSelection);
    
    yield call(
      apiEndpoint,
      { collectionName: activeCollection },
      data,
    );

    yield put(actions.updateConfigurationDataSuccess());
  } catch (e) {
    yield put(actions.updateConfigurationDataFailure());
  }
}

function* updateConfigurationFieldSaga({type, payload}) {
  try {
    const response = yield call(
      api.dashboard.updateConfigField,
      { collectionName: payload.activeCollection },
      payload
    );
    if(response.data) alert('Successfully updated');
    yield put(actions.setConfiguration(response.data));
    // const data = configurationDataMapper
    //   .update[activeConfigurationField](editorSelection);

    // yield call(
    //   apiEndpoint,
    //   { collectionName: activeCollection },
    //   data,
    // );
    //yield put(actions.updateConfigurationDataSuccess());
  } catch (e) {
    yield put(actions.updateConfigurationDataFailure());
  }
}

function* loginUserSaga({type, payload}){
  console.log(payload);
  const response = yield call(api.dashboard.loginUser,payload);
  const data = response.data;
  
  if (data.success) {
		const { token } = data;
		localStorage.setItem('jwtToken', token);
		const cookies = new Cookies(); 
		cookies.set('jwtToken', token);
		// Set token to Auth header
		setAuthToken(token);
		// Decode token to get user data
		const decoded = jwt_decode(token);
		

		window.location = window.location.href.includes('/admin') ? '/admin' : '/';

	}
	else if (data.status === 'PASSWORD_INCORRECT') {
		alert('PASSWORD IS INCORRECT');
	}
	else if (data.status === 'USER_NOT_FOUND') {
		alert('USER NOT FOUND');
	}
	else if (data.status === 'NO_ACCESS') {
		alert('Your account have not been granted access. Contact administrator to get access.');
	}
	else {
		alert('LOG IN FAILED');
	}
}

export default function* dashboardSaga() {
  yield takeLatest(
    actions.getCollectionsAndFieldsRequest,
    getCollectionsAndFieldsSaga,
  );
  yield takeLatest(
    actions.setActiveCollectionConfiguration,
    setActiveCollectionConfigurationSaga,
  );
  yield takeLatest(
    actions.updateConfigurationDataRequest,
    updateConfigurationDataSaga,
  );
  yield takeLatest(
    actions.updateConfigField,
    updateConfigurationFieldSaga,
  );
  yield takeLatest(
    actions.loginUser,
    loginUserSaga,
  );
}
