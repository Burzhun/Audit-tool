import { combineReducers } from 'redux';

import dataReducer from './data';
import authReducer from './auth';

export default combineReducers({
  dataReducer, authReducer,
});
