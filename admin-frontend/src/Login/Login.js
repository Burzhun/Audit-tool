import React, {useState} from 'react';
import {Button, Container, Form} from 'semantic-ui-react';
import {connect} from 'react-redux';
import dashboardStore from '../store/dashboard/slice';

const {PUBLIC_URL} = process.env;

const Login = (props) => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function loginUser() {
        props.loginUser({
            email: email,
            password: password
        });
    }

    return (
      <div className="layout">
        <div className="main-header">
          <div className="header-container">
            <div className="header-left-group">
              <img alt="logo" className="logo" src={`${PUBLIC_URL}/images/fxc_logo.svg`} />
            </div>
          </div>
        </div>
        <div className="content">
          <Container className="main_page_container">
            <div className='formContainer'>
              <div className='headerText'>
                Log in and get to work
              </div>
              <Form>
                <Form.Field>
                  <label>Email</label>
                  <input placeholder='User ID' value={email} onChange={(e) => setEmail(e.target.value)} />
                </Form.Field>
                <Form.Field>
                  <label placeholder='Password'>Password</label>
                  <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} />
                </Form.Field>
                <div style={{textAlign: 'center'}}>
                  <Button data-qa="submit" className='green authBtn' onClick={loginUser}>Log In</Button>
                </div>
                <span style={{display: 'flex'}}>
                  <p style={{marginRight: '10px'}}> New to here? </p>
                  <a href='/auth-register'><p>Sign Up</p></a>
                </span>
              </Form>
            </div>
          </Container>
        </div>
      </div>
    )
}
const {
    loginUser
} = dashboardStore.actions;

const mapStateToProps = ({
                             [dashboardStore.name]: {
                                 register_result
                             },
                         }
) => ({
    register_result,
})


export default connect(mapStateToProps, {loginUser})(Login);