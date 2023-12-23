import { combineReducers } from '@reduxjs/toolkit';
import { connectRouter } from 'connected-react-router';
import dashboardSlice from './dashboard/slice';

export default (history) => combineReducers({
  router: connectRouter(history),
  [dashboardSlice.name]: dashboardSlice.reducer,
});
