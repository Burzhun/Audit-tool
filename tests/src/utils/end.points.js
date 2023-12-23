export class UiEndPoints {
    static AUTH_LOGIN = '/auth-login';
    static AUTH_REGISTER = '/auth-register';
    static USERS = '/users';
    static DASHBOARD = '/dashboard';

    static goToDetailsUrl(collectionName, recordID) {
        return `/detail/${collectionName}/${recordID}`;
    }
}

export class ApiEndPoints {
    static AUTH = '/auth';  //backend
    static DATABASE = '/database'; //backend
    static CONFIGURATIONS = '/configurations';  //backend
    static LOGIN = `${ApiEndPoints.AUTH}/login`;
    static NEW_USERS = '/new-users';
    static REGISTER = `${ApiEndPoints.AUTH}/register`;
    static SAVE_DATA = `${ApiEndPoints.DATABASE}/saveDatabase`;
    static GET_RECORD = `${ApiEndPoints.DATABASE}/getRecord`;
    static GLOBAL_UPDATE_SINGLE = `${ApiEndPoints.DATABASE}/globalUpdate`;
    static GLOBAL_UPDATE_ALL = `${ApiEndPoints.DATABASE}/globalUpdateAll`;
    static FETCH_DATA = `${ApiEndPoints.DATABASE}/fetchDatabase`;
    static SET_USER_CONFIG = `${ApiEndPoints.DATABASE}/setUserConfig`;
    static FETCH_CONFIG = `${ApiEndPoints.DATABASE}/fetchConfig`;
    static SET_EXTERNAL_USER_RECORDS = `${ApiEndPoints.AUTH}/setExternalUserRecords`;
    static CREATE_USER = `${ApiEndPoints.AUTH}/createUser`;
    static GET_CONFIGS = `${ApiEndPoints.DATABASE}/getConfigs`;
    static COPY = `${ApiEndPoints.DATABASE}/copy`;
    static UPDATE = `${ApiEndPoints.CONFIGURATIONS}/collections/FxFeesWB_testing/update`;
    static EXTERNAL_USERS = `${ApiEndPoints.AUTH}/externalUsers`;
    static INTERNAL_USERS = `${ApiEndPoints.AUTH}/internalUsers`;
    static UPDATE_USER_FIELDS = `${ApiEndPoints.AUTH}/updateUserFields`;
    static DELETE_USER = `${ApiEndPoints.AUTH}/deleteUser`;
}