import {
  SET_DATA, SET_CONFIG, ADD_SEARCH_FIELD, DELETE_FIELD, SET_CONFIG_LIST, SET_FILE, SET_CHART_DATA,
} from '../constants';

const initialState = {
  data: [],
  config: {},
  configs: [],
  collectionName: 'ProductData',
  dataChanged: false,
  fields: [],
};

export default function setBrowserInfo(state = initialState, action) {
  switch (action.type) {
    case SET_FILE:
      return {
        ...state,
        data: action.data,
        dataChanged: !state.dataChanged,
      };
    case SET_DATA:
      return {
        ...state,
        data: action.payload.data,
        count: action.payload.count,
        found: action.payload.found,
        dataChanged: !state.dataChanged,
      };
    case SET_CHART_DATA:
      return {
        ...state,
        chart_data: action.payload.data,
        count: action.payload.count,
        dataChanged: !state.dataChanged,
      };
    case SET_CONFIG_LIST:
      const no_configs_found = action.payload.configs.length === 0;

      return {
        ...state,
        configs: action.payload.configs.map((item) => item.CollectionRelevantFor),
        no_configs_found,
        dataChanged: !state.dataChanged,
      };
    case SET_CONFIG:
      localStorage.removeItem('config');
      localStorage.setItem('config', JSON.stringify(action.payload.config));
      const data = {
        ...state,
        config: action.payload.config,
        schema: action.payload.schema,
        collectionName: action.payload.collectionName,
        revision: action.payload.revision,
      };
      if (!action.payload.is_detail_page) data.data = [];
      return data;
    case ADD_SEARCH_FIELD: {
      const { fields } = action;
      return { ...state, fields };
    }
    case DELETE_FIELD: {
      const { fields } = action;
      return { ...state, fields };
    }
    default:
      return state;
  }
}
