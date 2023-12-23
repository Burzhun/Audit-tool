import { AUTH_SET_REGISTERD_USER } from '../constants';

const initialState = {
  isAuthenticated: false,

  // Registered User Info
  user: {},
};

const isEmpty = require('is-empty');

export default function setBrowserInfo(state = initialState, action) {
  switch (action.type) {
    case AUTH_SET_REGISTERD_USER:
      return {
        ...state,
        user: action.data,
        isAuthenticated: !isEmpty(action.data),

      };

    default:
      return state;
  }
}
