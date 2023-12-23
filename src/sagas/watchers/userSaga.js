import { put, takeLatest, call } from 'redux-saga/effects';

import { push } from 'react-router-redux';
import Cookies from 'universal-cookie';
import jwt_decode from 'jwt-decode';
import { AUTH_REGISTER, AUTH_LOGIN, CHANGE_PASSWORD } from '../../constants';
import { registerUser, loginUser, changePassword } from '../../lib/api';

import { setRegisterdUser } from '../../actions';

import setAuthToken from '../../utils/setAuthToken';

function* workerRegisterSaga(actions) {
  const data = yield call(registerUser, actions.data);

  if (data.success) {
    alert('SIGN UP SUCCESS');
    yield put(push('./auth-login'));
  } else if (data.status && data.status === 'USER_EXISTS') { alert('User with this email is already registered'); } else alert('SIGN UP FAILED');
}
function* workerLoginSaga(actions) {
  const data = yield call(loginUser, actions.data);

  if (data.success) {
    const { token } = data;
    localStorage.setItem('jwtToken', token);
    const cookies = new Cookies();
    cookies.set('jwtToken', token);
    // Set token to Auth header
    setAuthToken(token);
    // Decode token to get user data
    const decoded = jwt_decode(token);
    yield put(setRegisterdUser(decoded));

    yield put(push('./dashboard'));
  } else if (data.status === 'PASSWORD_INCORRECT') {
    alert('PASSWORD IS INCORRECT');
  } else if (data.status === 'USER_NOT_FOUND') {
    alert('USER NOT FOUND');
  } else if (data.status === 'NO_ACCESS') {
    alert('Your account have not been granted access. Contact administrator to get access.');
  } else {
    alert('LOG IN FAILED');
  }
}

function* workerChangePasswordSaga(actions) {
  const { user_id, old_password, new_password } = actions.payload;
  const data = yield call(changePassword, user_id, old_password, new_password);

  if (data.success) {
    alert('Password changed successfully');
  } else if (data.status && data.status === 'PASSWORD_INCORRECT') { alert('Old password is incorrect'); } else alert('Changing password FAILED');
}
export default function* watchGetUsersSaga() {
  yield takeLatest(AUTH_REGISTER, workerRegisterSaga);
  yield takeLatest(AUTH_LOGIN, workerLoginSaga);
  yield takeLatest(CHANGE_PASSWORD, workerChangePasswordSaga);
}
