import axios from 'axios';
import dashboard from './dashboard';

axios.defaults.baseURL = process.env.REACT_APP_API_URL;

const api = {
  dashboard,
};
const setAuthToken = token => {
  if (token) {
    // Apply authorization token to every request if logged in
    axios.defaults.headers.common['Authorization'] = token;
    axios.defaults.headers.common['x-access-token'] = token;
  } else {
    // Delete auth header
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['x-access-token'];
  }
};
export default api;
export {setAuthToken as setAuthToken};
