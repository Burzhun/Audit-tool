import axios from 'axios';
var config = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-access-token': localStorage.jwtToken ? localStorage.jwtToken : '4646'
  }
};
const dashboard = {
  getConfig: async ({ collectionName }) => (
    axios.post(`/configurations/${collectionName}`,{},config)
  ),
  getCollections: async () => (
    axios.post('/configurations/collections',{},config) 
  ),
  getConfigurationFields: async () => (
    axios.get('/configurations/fields')
  ),
  getEditableFields: async ({ collectionName }) => (
    axios.get(`/configurations/collections/${collectionName}/fields/editable`)
  ),
  updateEditableFields: async ({ collectionName }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/editable`, data)
  ),
  getDisplayableFields: async ({ collectionName }) => (
    axios.get(`/configurations/collections/${collectionName}/fields/displayable`)
  ),
  updateDisplayableFields: async ({ collectionName }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/displayable`, data)
  ),
  getCollectionVisibility: async ({ collectionName }) => (
    axios.get(`/configurations/collections/${collectionName}/visibility`)
  ),
  updateCollectionVisibility: async ({ collectionName }, data) => (
    axios.put(`/configurations/collections/${collectionName}/visibility`, data)
  ),
  getCollectionRecordCreation: async ({ collectionName }) => (
    axios.get(`/configurations/collections/${collectionName}/records/creation`)
  ),
  updateCollectionRecordCreation: async ({ collectionName }, data) => (
    axios.put(`/configurations/collections/${collectionName}/records/creation`, data)
  ),
  getAuditSessionFields: async ({ collectionName }) => (
    axios.get(`/configurations/collections/${collectionName}/fields/audit`)
  ),
  updateAuditSessionFields: async ({ collectionName }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/audit`, data)
  ),
  getMiddleScreenFields: async ({ collectionName }) => (
    axios.get(`/configurations/collections/${collectionName}/fields/middle-screen`)
  ),
  updateMiddleScreenFields: async ({ collectionName }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/middle-screen`, data)
  ),
  getSearchResultFields: async ({ collectionName }) => (
    axios.get(`/configurations/collections/${collectionName}/fields/search-result`)
  ),
  updateSearchResultFields: async ({ collectionName }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/search-result`, data)
  ),
  getSearchFields: async ({ collectionName }) => (
    axios.get(`/configurations/collections/${collectionName}/fields/search`)
  ),
  updateSearchFields: async ({ collectionName }, data) => (
    axios.put(`/configurations/collections/${collectionName}/fields/search`, data)
  ),
  updateConfigField: async ({ collectionName }, data) => (
    axios.put(`/configurations/collections/${collectionName}/update`, data)
  ),
  loginUser: async(data)=>(
    axios.post('/users/login', data,{
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
  )
};


export default dashboard;
