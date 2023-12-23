import {
  GET_DATA_BY_FIRMID, SET_DATA, SET_CHART_DATA, SAVE_DATA, SET_CONFIG, GET_CONFIG, COPY_RECORD, GET_CONFIGS,
  AUTH_REGISTER, AUTH_SET_REGISTERD_USER, AUTH_LOGIN, DELETE_FIELD, ADD_SEARCH_FIELD, SET_CONFIG_LIST,
  GET_RECORD, UPLOAD_FILE, SET_FILE, ADD_RECORD, REMOVE_FILE, CHANGE_PASSWORD,
} from '../constants';

import setAuthToken from '../utils/setAuthToken';

export function setData(data, count, found=true) {
  return {
    type: SET_DATA,
    payload: { data, count, found },
  };
}

export function setChartSearchData(data, count) {
  return {
    type: SET_CHART_DATA,
    payload: { data, count },
  };
}

export function setConfig(config, schema, collectionName, revision, is_detail_page) {
  return {
    type: SET_CONFIG,
    payload: {
      config, schema, collectionName, revision, is_detail_page,
    },
  };
}

export function setConfigList(configs) {
  return {
    type: SET_CONFIG_LIST,
    payload: { configs },
  };
}

export function getConfig(collectionName) {
  return {
    type: GET_CONFIG,
    payload: { collectionName },
  };
}

export function getConfigs() {
  return {
    type: GET_CONFIGS,
  };
}

// TODO: rename properly
export function getDataByFirmID(filters, tableFilters, sorting_data, collectionName, page_number, page_size, isChartScreen = false) {
  return {
    type: GET_DATA_BY_FIRMID,
    payload: {
      filters, tableFilters, sorting_data, collectionName, page_number, page_size, isChartScreen,
    },
  };
}

export function getRecord(value, collectionName) {
  return {
    type: GET_RECORD,
    payload: { value, collectionName },
  };
}

export function saveData(data) {
  return {
    type: SAVE_DATA,
    data,
  };
}

// Authentication

export function registerUser(data) {
  return {
    type: AUTH_REGISTER,
    data,
  };
}
export function setRegisterdUser(data) {
  return {
    type: AUTH_SET_REGISTERD_USER,
    data,
  };
}

export function loginUser(data) {
  return {
    type: AUTH_LOGIN,
    data,
  };
}

export function changePassword(user_id, old_password, new_password) {
  return {
    type: CHANGE_PASSWORD,
    payload: { user_id, old_password, new_password },
  };
}

export function logoutUser() {
  localStorage.removeItem('jwtToken');
  setAuthToken(false);
  document.location = '/auth-login';
  const data = {};
  return {
    type: AUTH_SET_REGISTERD_USER,
    data,
  };
}

export function addSearchField(fields) {
  return {
    type: ADD_SEARCH_FIELD,
    fields,
  };
}

export function deleteField(fields) {
  return {
    type: DELETE_FIELD,
    fields,
  };
}

export function uploadFile(data) {
  return {
    type: UPLOAD_FILE,
    data,
  };
}

export function removeFile(data) {
  return {
    type: REMOVE_FILE,
    data,
  };
}

export function setFile(data) {
  return {
    type: SET_FILE,
    data,
  };
}

export function copyRecord(firmID, recordID, collectionName, UserName) {
  return {
    type: COPY_RECORD,
    payload: {
      firmID, recordID, collectionName, UserName,
    },
  };
}

export function addRecord(fields, collectionName, UserName) {
  return {
    type: ADD_RECORD,
    payload: { fields, collectionName, UserName },
  };
}
