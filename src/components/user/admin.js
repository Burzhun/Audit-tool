import React, { useState } from 'react';
import { Header, Input, Button } from 'semantic-ui-react';

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Admin = (props) => {
  const [email, setEmail] = useState('');

  function setAccess(email, type) {
    const data = {
      email,
      type,
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
      if (response.success) alert('Successfuly updated');
      else if (response.not_found) { alert('User not found'); } else alert('Operation failed');
    });
  }
  return (
    <div style={{ margin: '20px' }}>
      <h2>Grant or revoke user access to app</h2>
      <Input onChange={(e) => setEmail(e.target.value)} type="text" placeholder="User email" style={{ marginRight: '20px', width: '250px' }} />
      <Button onClick={() => setAccess(email, 1)}>Grant access</Button>
      <Button onClick={() => setAccess(email, -1)}>Revoke access</Button>
    </div>
  );
};

export default Admin;
