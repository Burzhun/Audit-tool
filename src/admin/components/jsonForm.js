import React, { useState, useEffect } from 'react';
import { Form, TextArea } from 'semantic-ui-react';

const JsonForm = (props) => {
  const [jsonText, setJsonText] = useState('');

  useEffect(() => {
    window.validator_json_error = false;
    const data = { ...props.data };
    delete data.name;
    const text = JSON.stringify(data, null, '\t');
    setJsonText(text);
  }, []);

  const lines = jsonText.split('\n');

  function setData(text) {
    setJsonText(text);
    if (!isJson(text)){
      window.validator_json_error = true;
      return;
    }
    window.validator_json_error = false;
    const data = JSON.parse(text);
    data.name = props.data.name;
    props.setCollection(data);
  }

  function isJson(str) {
    if (typeof str !== 'string') return false;
    try {
      const result = JSON.parse(str);
      const type = Object.prototype.toString.call(result);
      return type === '[object Object]'
                || type === '[object Array]';
    } catch (err) {
      return false;
    }
  }

  return (
    <Form style={{ marginBottom: '15px' }}>
      <TextArea onChange={(e, data) => setData(data.value)} className="validator-json-textarea" value={jsonText} rows={lines.length} />
    </Form>
  );
};

export default JsonForm;
