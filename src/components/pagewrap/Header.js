import React, { Component } from 'react';
import { connect } from 'react-redux';

import { withRouter } from 'react-router';

import { logoutUser } from '../../actions';

import './Header.scss';

const dotenv = require('dotenv');

dotenv.config();
const prod = process.env.REACT_APP_PROD;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'x-access-token': localStorage.jwtToken,
  host: window.location.hostname,
};

class Header extends Component {
  constructor() {
    super();
    this.state = { newUsersCount: 0 };
    this.logOut = this.logOut.bind(this);
    this.loadNewUsers = this.loadNewUsers.bind(this);
  }

  componentDidMount() {
    if (this.props.user.role === 'Admin') this.loadNewUsers();
  }

  async loadNewUsers() {
    fetch(`${BACKEND_URL}/auth/new-users?count=1`, {
      method: 'GET',
      headers,
    }).then((response) => response.json()).then((data) => {
      if (data.count) this.setState({ newUsersCount: data.count });
    });
  }

  logOut() {
    this.props.logOut();
  }

  // Render
  render() {
    const { isAuthenticated } = this.props;
    const name = `${this.props.user.first_name} ${this.props.user.last_name}`;
    const staging = prod === '1' ? '' : 'staging';
    const user_role = this.props.user.role;
    return (
      <div className={`main_header ${staging}`}>
        <a href="/">
          <div className="logo" />
        </a>
        <div style={{ fontSize: '20px' }}>{staging}</div>
        {isAuthenticated
          ? (
            <div className="menuLinkContainer">
              <a
                href="/profile"
                data-qa="profile"
                className="menuText"
              >
                {' '}
                {name}
                {this.state.newUsersCount > 0 && '*'}
              </a>
              {user_role == 'Admin'
                && <a data-qa="users" className="menuLink" href="/users">Users</a>}              
              {user_role == 'Manager'
                && <a data-qa="users" className="menuLink" href="/users">Users</a>}
              {user_role == 'Admin'
                && <a data-qa="admin" className="menuLink" href="/admin">Admin Panel</a>}
              <p data-qa="logout" className="menuLink" onClick={this.logOut}>Log Out</p>
            </div>
          )
          : (
            <div className="menuLinkContainer">
              <a href="/auth-login" data-qa="login"><p className="menuLink">Log In</p></a>
            </div>
          )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  isAuthenticated: state.authReducer.isAuthenticated,
  user: state.authReducer.user,
}

);

const mapDispatchToProps = (dispatch) => (
  {
    logOut: () => dispatch(logoutUser()),
  }
);

export default connect(mapStateToProps, mapDispatchToProps)(withRouter(Header));
