import 'react-app-polyfill/stable';
import 'promise-polyfill/src/polyfill';
import 'es6-object-assign/dist/object-assign-auto';
import 'isomorphic-fetch';
import 'react-app-polyfill/ie11';
import React from 'react';
import { render } from 'react-dom';

// import registerServiceWorker from './registerServiceWorker';

import AppRouter from './AppRouter';

const rootElement = document.getElementById('root');
render(<AppRouter />, rootElement);

// registerServiceWorker();
