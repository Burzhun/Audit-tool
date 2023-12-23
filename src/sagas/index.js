import { all, fork } from 'redux-saga/effects';

import watchGetDataSaga from './watchers/getData';
import watchUserSaga from './watchers/userSaga';

export default function* root() {
  yield all([
    fork(watchGetDataSaga), fork(watchUserSaga),
  ]);
}
