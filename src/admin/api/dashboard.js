import axios from 'axios';

const config = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'x-access-token': localStorage.jwtToken ? localStorage.jwtToken : '4646',
  },
};
const dashboard = {
  getConfig: async ({ collectionName, newCollection, user_type }) => (
    axios.post(`/configurations/${collectionName}`, { newCollection, user_type }, config)
  ),
  getCollections: async () => (
    axios.post('/configurations/collections', {}, config)
  ),
  getConfigurationFields: async ({ user_type }) => (
    axios.post('/configurations/fields', { user_type })
  ),
  getEditableFields: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/fields/editable`, { user_type })
  ),
  getFieldsToCreate: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/fields/fieldstocreate`, { user_type })
  ),
  updateFieldsToCreate: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/fieldstocreate`, data)
  ),
  updateEditableFields: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/editable`, data)
  ),
  getDisplayableFields: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/fields/displayable`, { user_type })
  ),
  updateDisplayableFields: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/displayable`, data)
  ),
  getCollectionVisibility: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/visibility`, { user_type })
  ),
  updateCollectionVisibility: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/visibility`, data)
  ),
  getCollectionRecordCreation: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/records/creation`, { user_type })
  ),
  updateCollectionRecordCreation: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/records/creation`, data)
  ),
  getAuditSessionFields: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/fields/audit`, { user_type })
  ),
  updateAuditSessionFields: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/audit`, data)
  ),
  getNestedSearchFields: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/fields/nested-search`, { user_type })
  ),
  updateNestedSearchFields: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/nested-search`, data)
  ),
  getMiddleScreenFields: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/fields/middle-screen`, { user_type })
  ),
  updateMiddleScreenFields: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/middle-screen`, data)
  ),
  getSearchResultFields: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/fields/search-result`, { user_type })
  ),
  updateSearchResultFields: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/search-result`, data)
  ),
  getSearchFields: async ({ collectionName, user_type }) => (
    axios.post(`/configurations/collections/${collectionName}/fields/search`, { user_type })
  ),
  updateSearchFields: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/search`, data)
  ),
  updateConfigField: async ({ collectionName, user_type }, data) => (
    axios.put(`/configurations/collections/${collectionName}/update`, data)
  ),
  loginUser: async (data) => (
    axios.post('/users/login', data, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
  ),
};

export default dashboard;
