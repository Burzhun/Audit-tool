import React, { Component } from 'react';

import { Provider } from 'react-redux';
import { Router, Route, Switch } from 'react-router-dom';

import store, { history } from './store';

import Dashboard from './screens/Dashboard';
import DetailDialog from './screens/Detail';
import Home from './screens/Home';
import LogIn from './components/auth/login';
import Register from './components/auth/register';
import Admin from './components/user/admin';

import Logs from './screens/Logs';
import Header from './components/pagewrap/Header';

import 'semantic-ui-css/semantic.min.css';
import './App.scss';



export default class App extends Component {

	render() {
		return (
  <Provider store={store}>
    <Router history={history}>		
		<div>
			<Header />
			<Switch>
			  <Route exact path="/">
				<Home  history={history} />
			  </Route>
			  <Route exact path="/detail/:collectionName/:RecordId/:firmId" component={DetailDialog} />
			  <Route exact path="/detail/:collectionName/:RecordId" component={DetailDialog} />
			  <Route exact path="/dashboard" component={Dashboard} />
			  <Route path="/auth-login" component={LogIn} />
			  <Route path="/auth-register" component={Register} />
			  <Route path="/user-manager" component={this.props.decoded.role==='Admin' ? Admin : Home} />
			  {this.props.decoded.role==='Admin' && <Route path="/logs" component={Logs} />}
			</Switch>
		</div>
    </Router>
  </Provider>
		);
	}
}
