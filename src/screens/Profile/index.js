import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { Button, Input, Form, Select } from 'semantic-ui-react';
import Header from '../../components/pagewrap/Header';

import { changePassword } from '../../actions';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'x-access-token': localStorage.jwtToken,
  host: window.location.hostname,
};

export const Profile = (props) => {
  const [showform, setShowForm] = useState(false);
  const [new_email, setNewEmail] = useState('');
  const [new_name, setNewName] = useState('');
  const [usertype, setUsertype] = useState('');
  const [new_surname, setSurNewName] = useState('');
  const [new_user_text, setNewUserText] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUsers, setNewUsers] = useState([]);

  

  const { user } = props;

  useEffect(() => {
    if (user.role === 'Admin') loadNewUsers();
  }, []);

  async function loadNewUsers() {
    fetch(`${BACKEND_URL}/auth/new-users`, {
      method: 'GET',
      headers,
    }).then((response) => response.json()).then((data) => {
      if (data.users) setNewUsers(data.users);
    });
  }

  function giveAccess(email) {
    const data = {
      email,
      type: 1,
    };
    fetch(`${BACKEND_URL}/user-manager`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-access-token': localStorage.jwtToken,
      },
      body: JSON.stringify(data),
    }).then((response) => response.json()).then((response) => {
      loadNewUsers();
      if (response.success) alert('Successfuly updated');
      else if (response.not_found) { alert('User not found'); } else alert('Operation failed');
    });
  }

  function deleteUser(email) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    fetch(`${BACKEND_URL}/auth/deleteUser`, {
      method: 'POST',
      headers,
      body:JSON.stringify({email:email})   
    }).then((response) => response.json()).then((data) => {
      if (data.success) alert('User was deleted');
      else alert('User deleting failed');
      loadNewUsers();
    });
  }

  function createUser() {
    setNewUserText('');
    if(usertype===''){
      setNewUserText('Set user type');
      return;
    }
    document.getElementById('new_email_value').type = 'email';
    if (document.getElementById('new_email_value').validity.valid && new_email != '') {
      fetch(`${BACKEND_URL}/auth/createUser`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: new_email, first_name: new_name, last_name: new_surname, usertype, location, Upwork_Id, Upwork_Profile_Id }),
      }).then((response) => response.json()).then((data) => {
        if (data.success) {
          setNewUserText(`New User account was created. Email:${data.email} , Password:${data.password}`);
        } else{
          if(data.status === "USER_EXISTS") setNewUserText("User already exists")
          else setNewUserText('User creating failed');
        }
      });
    } else {
      setNewUserText('Email is incorrect');
    }
  }

  return (
    <div>
      <Header />
      <div className="container" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'start' }}>
        <div style={{}}>
          <h2> User Profile </h2>
          <div>
            <span style={{ fontSize: '17px' }}>
              Email
              <span style={{ marginLeft: '15px' }}>{user.email}</span>
            </span>
          </div>
          <div>
            <span style={{ fontSize: '17px' }}>
              Name
              <span style={{ marginLeft: '15px' }}>
                {user.first_name}
                {' '}
                {user.last_name}
              </span>
            </span>
          </div>
          <div>
            <span style={{ fontSize: '17px' }}>
              Role
              <span style={{ marginLeft: '15px' }}>{user.role}</span>
            </span>
          </div>
          {user.location && <div>
            <span style={{ fontSize: '17px' }}>
              Location
              <span style={{ marginLeft: '15px' }}>{user.location}</span>
            </span>
          </div>}
          {user.Upwork_Id && <div>
            <span style={{ fontSize: '17px' }}>
              Upwork_Id
              <span style={{ marginLeft: '15px' }}>{user.Upwork_Id}</span>
            </span>
          </div>}
          {user.Upwork_Profile_Id && <div>
            <span style={{ fontSize: '17px' }}>
              Upwork_Profile_Id
              <span style={{ marginLeft: '15px' }}>{user.Upwork_Profile_Id}</span>
            </span>
          </div>}
          {newUsers.length > 0 && (
            <div style={{ fontSize: '16px', marginTop: '15px' }}>
              <div>New Users</div>
              <div>
                {newUsers.map((user) => (
                  <div key={user.UserId}>
                    <span style={{ display: 'inline-block', width: '250px', marginBottom: '10px' }}>
                      {user.FirstName}
                      {' '}
                      {user.LastName}
                    </span>
                    <span style={{
                      display: 'inline-block', width: '250px', marginBottom: '10px', marginRight: '10px', marginLeft: '10px',
                    }}
                    >
                      {user.RegisteredUserEmail}
                    </span>
                    <Button onClick={() => giveAccess(user.RegisteredUserEmail)}>Give Access</Button>
                    <Button className="red" onClick={() => deleteUser(user.RegisteredUserEmail)}>Delete user</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ marginLeft: '110px' }}>
          {!showform ? <Button onClick={() => setShowForm(true)}>Change password</Button>
            : (
              <div style={{ flexDirection: 'column', display: 'flex' }}>
                <span>Old password</span>
                <Input value={oldPassword} onChange={(e, data) => setOldPassword(data.value)} />
                <span>New password</span>
                <Input value={newPassword} onChange={(e, data) => setNewPassword(data.value)} />
                <br />
                <div>
                  <Button onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button disabled={!newPassword || !oldPassword} color="green" onClick={() => props.changePassword(user.user_id, oldPassword, newPassword)}>Set password</Button>
                </div>
              </div>
            )}

        </div>
        
      </div>
    </div>
  );
};
const mapStateToProps = (state) => ({
  register_result: state.authReducer.register_result,
});

const mapDispatchToProps = (dispatch) => ({
  changePassword: (user_id, old_password, new_password) => dispatch(changePassword(user_id, old_password, new_password)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
