const path = require('path')

module.exports = {
  'env': {
    'browser': true,
    'node': true,
    'es6': true
  },
  'parser': 'babel-eslint',
  'rules': {
    'no-console': 0,
    'no-unused-vars': 0,
    'quotes': [2, 'single'],
    'strict': [2, 'never'],
    'react/prop-types': 2,
    'react/jsx-uses-react': 2,
    'react/jsx-uses-vars': 2,
    'react/react-in-jsx-scope': 2,
    'react/jsx-key': 1,
    'react/jsx-indent': [2, 2],
    'react/jsx-tag-spacing': 2,
    'react/jsx-wrap-multilines': 2,
    'react/jsx-indent-props': [2, 2],
    'react/jsx-closing-bracket-location': 2,
    'react/jsx-closing-tag-location': 2,
    'react/jsx-equals-spacing': [2, 'never'],
    'react/jsx-filename-extension': 2,
    'react/jsx-first-prop-new-line': 2,
    'react/jsx-curly-spacing': [2, {'when': 'never', 'children': true}],
    'react/no-deprecated': 0
  },
  'plugins': [
    'react'
  ],
  'extends': [
    "airbnb",
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:import/errors',
    'plugin:import/warnings'
  ],
  'settings': {
    'import/parser': 'babel-eslint',
    'react': {
      'createClass': 'createReactClass', // Regex for Component Factory to use,
                                         // default to "createReactClass"
      'pragma': 'React',  // Pragma to use, default to "React"
      'fragment': 'Fragment',  // Fragment to use (may be a property of <pragma>), default to "Fragment"
      'version': 'detect', // React version. "detect" automatically picks the version you have installed.
                           // You can also use `16.0`, `16.3`, etc, if you want to override the detected value.
                           // default to latest and warns if missing
                           // It will default to "detect" in the future
      'flowVersion': '0.53' // Flow version
    }
  },
  'root':true,
  
};
