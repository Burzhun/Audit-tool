import React, { Component } from 'react';

import { Provider } from 'react-redux';
import { Router, Route, Switch } from 'react-router-dom';

import store, { history } from './store';

import App from './App.jsx';
import AdminApp from './admin/App/AdminApp.jsx';

import Profile from './screens/Profile/index';
import 'semantic-ui-css/semantic.min.css';
import './App.scss';

import { setRegisterdUser, logoutUser } from './actions';

import jwt_decode from 'jwt-decode';
import setAuthToken from './utils/setAuthToken';

let decoded = false;
if (localStorage.jwtToken) {
	// Set auth token header auth
	const token = localStorage.jwtToken;
	setAuthToken(token);
	// Decode token and get user info and exp
	decoded = jwt_decode(token);
	// Set user and isAuthenticated
	store.dispatch(setRegisterdUser(decoded));
	// Check for expired token
	const currentTime = Date.now() / 1000; // to get in milliseconds
	if (decoded.exp < currentTime) {
		// Logout user 
		store.dispatch(logoutUser());

		// Redirect to login
		window.location.href = './login';
	}else{
		if(window.location.pathname==='/admin/login'){
			window.location.href = '/admin';
		}
	}
}

export default class AppRouter extends Component {
	render() {
		return (
            <Router  history={history} >
                <Switch>
                    {decoded.role==='Admin' && <Route path="/admin" > <AdminApp user={decoded} /></Route>}
                    {(decoded.role==='Admin' || decoded.role==='Manager') && <Route path="/users"><AdminApp user={decoded} /></Route>}
                    <Route path="/profile" >
						<Provider store={store}>
							<Profile user={decoded} />
    					</Provider>
					</Route>
                    <Route path="/" > 
						<App decoded={decoded} />
					</Route>
                </Switch>
            </Router>
		);
	}
}
