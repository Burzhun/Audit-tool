import jwt_decode from 'jwt-decode';
import setAuthToken from '../utils/setAuthToken';

const dotenv = require('dotenv');

dotenv.config();

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'x-access-token': localStorage.jwtToken,
  host: window.location.hostname,
};

// DB Management APIs
export async function getData(filters, tableFilters, sorting_data, collectionName, page_number, page_size) {
  return fetch(`${BACKEND_URL}/database/fetchDatabase`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      collectionName,
      filters: filters.concat(tableFilters),
      sorting_data,
      page_number,
      page_size,
    }),
  }).then((response) => response.json());
}

export async function getRecord(value, collectionName) {
  return fetch(`${BACKEND_URL}/database/getRecord`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      value,
      collectionName,
    }),
  }).then((response) => response.json());
}

export async function getConfig(collectionName) {
  const decoded = jwt_decode(localStorage.jwtToken);
  let config_query = `?name=${collectionName}`;
  if (collectionName === '') { config_query = localStorage.getItem('config_name') ? `?name=${localStorage.getItem('config_name')}` : ''; }
  if (!headers['x-access-token']) {
    for (let i = 0; i < 10; i++) {
      headers['x-access-token'] = localStorage.jwtToken;
      if (headers['x-access-token']) { break; }
      setTimeout(() => {}, 500);
    }
  }
  return fetch(`${BACKEND_URL}/database/fetchConfig${config_query}&email=${decoded.email}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  }).then((response) => response.json());
}

export async function getConfigs() {
  let token = localStorage.jwtToken;
  if (!headers['x-access-token']) {
    for (let i = 0; i < 10; i++) {
      token = localStorage.jwtToken;
      headers['x-access-token'] = token;
      if (token) { break; }
    }
  }
  // Decode token and get user info and exp
  const decoded = jwt_decode(token);
  setAuthToken(token);
  return fetch(`${BACKEND_URL}/database/getConfigs?email=${decoded.email}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  }).then((response) => response.json());
}

export async function setUserConfig(data, collectionName) {
  let token = localStorage.jwtToken;
  if (!headers['x-access-token']) {
    for (let i = 0; i < 10; i++) {
      token = localStorage.jwtToken;
      headers['x-access-token'] = token;
      if (token) { break; }
    }
  }
  // Decode token and get user info and exp
  const decoded = jwt_decode(token);
  const { email } = decoded;
  setAuthToken(token);
  return fetch(`${BACKEND_URL}/database/setUserConfig`, {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ data, collectionName, email }),
  }).then((response) => response.json());
}

export async function saveData(data, collectionName) {
  return fetch(`${BACKEND_URL}/database/saveDatabase`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  }).then((response) => response.json());
}

export async function getAudit(VersionId) {
  return fetch(`${BACKEND_URL}/audit/getAudit`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ VersionId }),
  }).then((response) => response.json());
}

export async function getAuditData(AuditId) {
  return fetch(`${BACKEND_URL}/audit/getAuditData`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ AuditId }),
  }).then((response) => response.json());
}

// User Authentication APIs
export async function registerUser(user) {
  return fetch(`${BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  }).then((response) => response.json());
}
export async function loginUser(user) {
  return fetch(`${BACKEND_URL}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  }).then((response) => response.json());
}
export async function changePassword(user_id, old_password, new_password) {
  return fetch(`${BACKEND_URL}/auth/changePassword`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id,
      old_password,
      new_password,
    }),
  }).then((response) => response.json());
}

export async function copyRecord(firmID, recordID, collectionName, UserName) {
  return fetch(`${BACKEND_URL}/database/copy`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      firmID,
      recordID,
      collectionName,
      UserName,
    }),
  }).then((response) => response.json());
}

export async function uploadFile(data) {
  // this.setState({upload_name:'Uploading...'});
  return fetch(`${BACKEND_URL}/database/uploadFile`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'x-access-token': localStorage.jwtToken,
    },
    body: data,
  }).then((response) => response.json());
}

export async function addRecord(fields, collectionName, UserName) {
  return fetch(`${BACKEND_URL}/database/addRecord`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      fields,
      collectionName,
      UserName,
    }),
  }).then((response) => response.json());
}
export async function saveFunction(data) {
  return fetch(`${BACKEND_URL}/database/saveFunction`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      data,
    }),
  }).then((response) => response.json());
}
export async function removeFile(data) {
  // this.setState({upload_name:'Uploading...'});
  return fetch(`${BACKEND_URL}/database/removeFile`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  }).then((response) => response.json());
}
