import { combineReducers } from '@reduxjs/toolkit';
import { connectRouter } from 'connected-react-router';
import dashboardSlice from './dashboard/slice';

export default (history) => {
  const dash_slice = {};
  dash_slice.router = connectRouter(history);
  dash_slice[dashboardSlice.name] = dashboardSlice.reducer;
  return dash_slice;
};
