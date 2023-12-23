import { put, takeLatest, call } from 'redux-saga/effects';
import {
  GET_DATA_BY_FIRMID, SAVE_DATA, GET_CONFIG, ADD_RECORD,
	    COPY_RECORD, GET_CONFIGS, GET_RECORD, UPLOAD_FILE, REMOVE_FILE,
} from '../../constants';

import {
  setData, setChartSearchData, setConfig, setConfigList,
} from '../../actions';
import {
  getData, saveData, getConfig, copyRecord, getConfigs, getRecord, uploadFile, addRecord, removeFile,
} from '../../lib/api';

function* workerGetDataSaga(actions) {
  const data = yield call(getData, actions.payload.filters, actions.payload.tableFilters, actions.payload.sorting_data, actions.payload.collectionName, actions.payload.page_number, actions.payload.page_size);
  let dt = data.data;
  const { count } = data;
  if (!data.success) { dt = []; }
  if (actions.payload.isChartScreen) { yield put(setChartSearchData(dt, count)); } else { yield put(setData(dt, count)); }
}

function* workerGetRecordSaga(actions) {
  const data = yield call(getRecord, actions.payload.value, actions.payload.collectionName);
  let dt = data.data;
  let found = true;
  if (!data.success) { dt = []; found = false;}
  if (data.redirect) { document.location = '/dashboard/'; }
  yield put(setData(dt, 1, found));
}

function* workerGetConfigSaga(actions) {
  const data = yield call(getConfig, actions.payload.collectionName);
  let dt = data.config;
  const { collectionName } = data;
  const { revision } = data;
  const is_detail_page = actions.payload.collectionName !== '';
  if (!data.success) { dt = []; }
  yield put(setConfig(dt, data.schema, collectionName, revision, is_detail_page));
}

function* workerGetConfigsListSaga(actions) {
  const data = yield call(getConfigs);
  let { configs } = data;
  if (!data.success) { configs = []; }
  yield put(setConfigList(configs));
}

function* workerSaveDataSaga(actions) {
  const { recordId } = actions.data;
  const { collectionName } = actions.data;
  let new_errors = {};
  const da = yield call(saveData, actions.data, collectionName);
  if (da.not_updated_fields && da.not_updated_fields.length > 0) {
    alert(da.not_updated_fields.join('\n'));
  }
  if (da.validator_errors) new_errors = da.validator_errors;
  if (da.success) {
    if (da.new_record && da.collectionName) {
      document.location = `/detail/${collectionName}/${da.new_record.RecordId}/0`;
    }
    if (da.warnings && da.warnings.length > 0) {
      alert(`Warning: \n${da.warnings.join('\n')}`);
    }
    alert('Successfully updated!');
  } else {
    if (da.error) alert(da.error);
    if (da.warnings && da.warnings.length > 0) {
      alert(`Warning: \n${da.warnings.join('\n')}`);
    }
  }

  const data = yield call(getRecord, recordId, collectionName);
  let dt = data.data;
  if (!data.success) { dt = []; }
  yield put(setData(dt));
  if (actions.data.callback) actions.data.callback(new_errors, da.saveChangedValues);
}

function* workerCopyRecord(actions) {
  const { firmID } = actions.payload;
  const { recordID } = actions.payload;
  const { collectionName } = actions.payload;
  const { UserName } = actions.payload;

  const da = yield call(copyRecord, firmID, recordID, collectionName, UserName);
  if (da.success) {
    alert('Successfully copied!\n You will be moved into the new record.');
    const newRecordID = da.recordID;
    window.location = `/detail/${collectionName}/${newRecordID}/${firmID}`;
  } else {
    console.error(da);
  }
}

function* workerUploadFileSaga(actions) {
  const data = yield call(uploadFile, actions.data);
  const product = data.data;
  if (data.success) { yield put(setData(product)); }
}
function* workerRemoveFileSaga(actions) {
  const data = yield call(removeFile, actions.data);
  const product = data.data;
  if (data.success) { yield put(setData(product)); }
}

function* workerAddRecord(actions) {
  const { fields } = actions.payload;
  const { collectionName } = actions.payload;
  const { UserName } = actions.payload;

  const da = yield call(addRecord, fields, collectionName, UserName);
  if (da.success) {
    const message = `Successfully created!\n New Record ID = ${da.recordID}`;
    alert(message);
    window.open(`/detail/${collectionName}/${da.recordID}/null`, '_blank');
  } else {
    alert(da.error);
    console.error(da);
  }
}

export default function* watchGetUsersSaga() {
  yield takeLatest(GET_DATA_BY_FIRMID, workerGetDataSaga);
  yield takeLatest(GET_CONFIG, workerGetConfigSaga);
  yield takeLatest(GET_CONFIGS, workerGetConfigsListSaga);
  yield takeLatest(SAVE_DATA, workerSaveDataSaga);
  yield takeLatest(COPY_RECORD, workerCopyRecord);
  yield takeLatest(GET_RECORD, workerGetRecordSaga);
  yield takeLatest(UPLOAD_FILE, workerUploadFileSaga);
  yield takeLatest(ADD_RECORD, workerAddRecord);
  yield takeLatest(REMOVE_FILE, workerRemoveFileSaga);
}
