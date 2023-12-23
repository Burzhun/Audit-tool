import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import { routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import rootReducer from './rootReducer';
import rootSaga from './rootSaga';

const history = createBrowserHistory();
const sagaMiddleware = createSagaMiddleware();
const connectedRouterMiddleware = routerMiddleware(history);

const store = configureStore({
  reducer: rootReducer(history),
  middleware: [
    sagaMiddleware,
    connectedRouterMiddleware,
  ],
  devTools: true,
  preloadedState: {},
});

sagaMiddleware.run(rootSaga);

export { history };
export default store;
