import {
  GET_ADMIN_DATA,
  GET_ADMIN_DATA_SUCCEEDED,
  SET_ADMIN_LAYOUT,
  SET_CTM_ADMIN_LAYOUT,
  SET_HIDE_PLUGIN_USERS_PERMISSSIONS
} from "./constants";

export function getAdminData() {
  return {
    type: GET_ADMIN_DATA
  };
}

export function getAdminDataSucceeded(data) {
  return {
    type: GET_ADMIN_DATA_SUCCEEDED,
    data
  };
}

export function setAdminLayout(userInfos) {
  return {
    type: SET_ADMIN_LAYOUT,
    userInfos
  };
}

export function setCtmAdminLayout(data) {
  return {
    type: SET_CTM_ADMIN_LAYOUT,
    data
  };
}

export function setHidePluginUsersPermissions() {
  return {
    type: SET_HIDE_PLUGIN_USERS_PERMISSSIONS
  };
}