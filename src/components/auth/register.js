import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Button, Form } from 'semantic-ui-react';

import validator from 'validator';
import { registerUser } from '../../actions';

import './formContainer.scss';

export class Register extends Component {
  constructor() {
    super();
    this.state = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',

      firstNameError: false,
      lastNameError: false,
      emailError: false,
      passwordError: false,
    };

    this.registerUser = this.registerUser.bind(this);
  }

  registerUser() {
    let error = false;
    if (this.state.firstName === '') {
      this.setState({ firstNameError: true });
      error = true;
    } else {
      this.setState({ firstNameError: false });
    }

    if (this.state.lastName === '') {
      this.setState({ lastNameError: true });
      error = true;
    } else {
      this.setState({ lastNameError: false });
    }

    if (!validator.isEmail(this.state.email)) {
      this.setState({ emailError: true });
      error = true;
    } else {
      this.setState({ emailError: false });
    }

    if (this.state.password.length < 4) {
      this.setState({ passwordError: true });
      error = true;
    } else {
      this.setState({ passwordError: false });
    }

    if (error === false) {
      const data = {
        first_name: this.state.firstName,
        last_name: this.state.lastName,
        email: this.state.email,
        password: this.state.password,
      };
      this.props.registerUser(data);
    }
  }

  componentWillReceiveProps(nextProps) {
  }

  // Render
  render() {
    return (
      <div className="container" style={{ paddingTop: '50px' }}>
        <div className="formContainer">
          <div className="headerText">
            Get Your Account Here
          </div>
          <Form>
            <Form.Field>
              <label>First Name</label>
              <Form.Input
                data-qa="first-name"
                placeholder="First Name"
                value={this.state.firstName}
                onChange={(e) => this.setState({ firstName: e.target.value })}
                error={this.state.firstNameError}
              />
            </Form.Field>
            <Form.Field>
              <label>Last Name</label>
              <Form.Input
                data-qa="last-name"
                placeholder="Last Name"
                value={this.state.lastName}
                onChange={(e) => this.setState({ lastName: e.target.value })}
                error={this.state.lastNameError}
              />
            </Form.Field>
            <Form.Field>
              <label>Email Address</label>
              <Form.Input
                data-qa="email"
                placeholder="Email"
                value={this.state.email}
                onChange={(e) => this.setState({ email: e.target.value })}
                error={this.state.emailError}
              />
            </Form.Field>
            <Form.Field>
              <label placeholder="Password">Password</label>
              <Form.Input
                data-qa="password"
                type="password"
                value={this.state.password}
                onChange={(e) => this.setState({ password: e.target.value })}
                error={this.state.passwordError}
              />
              {
                                this.state.passwordError
                                && (
                                <p data-qa="pswd-error" style={{ color: 'red', fontSize: '10px' }}>
                                  Password must be more
                                  than 4 characters.
                                </p>
                                )
                            }
            </Form.Field>
            <div style={{ textAlign: 'center' }}>
              <Button data-qa="submit" className="green authBtn" onClick={this.registerUser}>
                Sign Me
                Up
              </Button>
            </div>
            <span style={{ display: 'flex' }}>
              <p style={{ marginRight: '10px' }}> Already have an account? </p>
              <a href="/auth-login"><p>Sing In</p></a>
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
  registerUser: (user) => dispatch(registerUser(user)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Register);
