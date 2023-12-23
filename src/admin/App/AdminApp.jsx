import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { Route, Router, Switch } from 'react-router-dom';
import store, { history } from '../store';
import Layout from '../Layout/Layout';
import Login from '../Login/Login';
import './App.scss';

function AdminApp(props) {
  return (
    <Provider store={store}>
      <Router history={history}>
          <Switch>
            <Route exact path="/admin/" >
              <Layout user={props.user} page='admin' />
            </Route>
            <Route exact path="/users/" >
              <Layout user={props.user} page='users' />
            </Route>
            <Route path="/admin/login" component={Login} /> 
          </Switch>
      </Router>
    </Provider>
  );
}

export default AdminApp;
