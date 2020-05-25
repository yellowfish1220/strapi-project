import { fromJS, Map } from "immutable";
import {
  GET_ADMIN_DATA_SUCCEEDED,
  SET_CTM_ADMIN_LAYOUT,
  SET_HIDE_PLUGIN_USERS_PERMISSSIONS
} from "./constants";

const initialState = fromJS({
  uuid: false,
  currentEnvironment: "development",
  isLoading: true,
  layout: Map({}),
  strapiVersion: "3",
  adminLayout: {},
  ctmAdminLayout: {},
  hidePluginUsersPermissions: false
});

function adminPageReducer(state = initialState, action) {
  switch (action.type) {
    case GET_ADMIN_DATA_SUCCEEDED:
      return state
        .update("uuid", () => action.data.uuid)
        .update("currentEnvironment", () => action.data.currentEnvironment)
        .update("layout", () => Map(action.data.layout))
        .update("strapiVersion", () => action.data.strapiVersion)
        .update("isLoading", () => false)
        .update("adminLayout", () => action.data.adminLayout);
    case SET_CTM_ADMIN_LAYOUT:
      return state.update("ctmAdminLayout", () => action.data);
    case SET_HIDE_PLUGIN_USERS_PERMISSSIONS:
      return state.update("hidePluginUsersPermissions", () => true);
    default:
      return state;
  }
}

export default adminPageReducer;