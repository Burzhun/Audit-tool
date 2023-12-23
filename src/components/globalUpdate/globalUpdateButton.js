import React, { useState } from 'react';
import { Button } from 'semantic-ui-react';

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const GlobalUpdateButton = (props) => {
  const [pipeline_message, setPipelineMessage] = useState('Update Calculated Fields');
  const [loading, setLoading] = useState(false);

  function globalUpdate() {
    if (loading) return;
    if (!window.confirm(('Warning. This will trigger Global Updates on the entire dataset. Updates may take some time (up to minutes) to run.'))) return;
    setLoading(true);
    const url = props.update_all ? '/database/globalUpdateAll' : '/database/globalUpdate';
    setPipelineMessage('Updating...');
    const data = {
      collectionName: props.collectionName,
      recordId: props.recordId,
      audit_info: props.audit_info,
      host: window.location.hostname,
    };
    fetch(BACKEND_URL + url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-access-token': localStorage.jwtToken,
      },
      body: JSON.stringify(data),
    }).then((response) => response.json()).then((response) => {
      setPipelineMessage('Update Calculated Fields');
      if (response.error) { alert(`Pipeline error: ${response.error}`); } else if (response.success && props.afterUpdate) props.afterUpdate();
      setLoading(false);
    });
  }

  return (
    <Button data-qa={pipeline_message} onClick={globalUpdate} className="globalUpdateButton" style={{}}>{pipeline_message}</Button>
  );
};
export default GlobalUpdateButton;
