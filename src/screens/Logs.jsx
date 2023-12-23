import React, { useState, useEffect } from 'react';
import { Button, Input, Form, Select } from 'semantic-ui-react';


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  'x-access-token': localStorage.jwtToken,
  host: window.location.hostname,
};

const Logs = (props) => {
  const [logs, setLogs] = useState('');


  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    fetch(`${BACKEND_URL}/database/showLog`, {
      method: 'GET',
      headers,
    }).then((response) => response.text()).then((data) => {
      setLogs(data);
    });
  }

  
  return (
    <div>
      <div>
          <br />
          {logs.split('\n').map(t=><div className='log_row'>{t.replace(/\"/g,'')}</div>)}
      </div>
    </div>
  );
};


export default Logs;
