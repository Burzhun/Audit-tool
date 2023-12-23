import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { Route, Switch } from 'react-router-dom';
import store, { history } from '../store';
import Layout from '../Layout/Layout';
import Login from '../Login/Login';
import './App.scss';

function App() {
  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
          <Switch>
            <Route exact path="/" component={Layout} />
            <Route exact path="/admin/" component={Layout} />
            <Route path="/login" component={Login} /> 
            <Route path="/admin/login" component={Login} /> 
          </Switch>
      </ConnectedRouter>
    </Provider>
  );
}

export default App;
