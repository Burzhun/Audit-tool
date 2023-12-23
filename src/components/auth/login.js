import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Button, Form } from 'semantic-ui-react';

import { loginUser } from '../../actions';

import './formContainer.scss';

export class Register extends Component {
  constructor() {
    super();
    this.state = {
      email: '',
      password: '',
    };

    this.loginUser = this.loginUser.bind(this);
  }

  loginUser() {
    const data = this.state;
    this.props.loginUser(data);
  }

  // Render
  render() {
    return (
      <div className="container" style={{ paddingTop: '50px' }}>
        <div className="formContainer">
          <div className="headerText">
            Log in and get to work
          </div>
          <Form>
            <Form.Field data-qa="email">
              <label>Email</label>
              <input
                placeholder="User ID"
                value={this.state.email}
                onChange={(e) => this.setState({ email: e.target.value })}
              />
            </Form.Field>
            <Form.Field data-qa="password">
              <label placeholder="Password">Password</label>
              <input
                type="password"
                value={this.state.password}
                onChange={(e) => this.setState({ password: e.target.value })}
              />
            </Form.Field>
            <div style={{ textAlign: 'center' }}>
              <Button data-qa="submit" className="green authBtn" onClick={this.loginUser}>Log In</Button>
            </div>
            <span style={{ display: 'flex' }}>
             {/* <p style={{ marginRight: '10px' }}> New to here? </p>
              <a data-qa="sign-up" href="/auth-register"><p>Sign Up</p></a>*/}
            </span>
          </Form>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  register_result: state.authReducer.register_result,
});

const mapDispatchToProps = (dispatch) => ({
  loginUser: (user) => dispatch(loginUser(user)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Register);
