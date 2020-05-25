import { get, isEmpty } from 'lodash';
import { all, fork, call, put, select, takeLatest } from 'redux-saga/effects';
import auth from 'utils/auth';
import request from 'utils/request';
import { pluginDeleted, updatePlugin } from 'containers/App/actions';
import { makeSelectAppPlugins, selectPlugins } from 'containers/App/selectors';
import { getAdminDataSucceeded, setHidePluginUsersPermissions } from './actions';
import { GET_ADMIN_DATA, SET_ADMIN_LAYOUT } from './constants';
import { makeSelectAdminLayout } from './selectors';

function* getData() {
  try {
    const appPlugins = yield select(makeSelectAppPlugins());
    const hasUserPlugin = appPlugins.indexOf('users-permissions') !== -1;
    let userInfos;

    if (hasUserPlugin && auth.getToken() !== null) {
      userInfos = yield call(request, `${strapi.backendURL}/users/me`, { method: 'GET' });
    }

    const [
      { uuid },
      { strapiVersion },
      { currentEnvironment },
      { adminLayout, layout },
    ] = yield all([
      call(request, '/admin/gaConfig', { method: 'GET' }),
      call(request, '/admin/strapiVersion', { method: 'GET' }),
      call(request, '/admin/currentEnvironment', { method: 'GET' }),
      call(request, '/admin/layout', { method: 'GET' }),
    ]);
    yield put(
      getAdminDataSucceeded({
        uuid,
        strapiVersion,
        currentEnvironment,
        layout,
        adminLayout,
      }),
    );

    if (userInfos) {
      yield call(setAdminLayout, userInfos);
    }
  } catch (err) {
    console.log(err); // eslint-disable-line no-console
  }
}

function* setAdminLayout(userInfos) {
  try {
    const layout = yield select(makeSelectAdminLayout());
    const plugins = yield select(selectPlugins());
    const pluginsObject = plugins.toJS();
    const { admin_layout } = userInfos.hasOwnProperty('userInfos')
      ? userInfos.userInfos
      : userInfos;
    const adminPermissions = isEmpty(admin_layout) ? 'admin' : admin_layout;
    const pluginsToHide = get(layout, [adminPermissions, 'pluginsToHide'], []);
 
    yield all(
      pluginsToHide
        .filter(plugin => plugin !== 'users-permissions')
        .map(plugin => put(pluginDeleted(plugin, false)))
    );
    // We can't remove the users-permissions plugin from the application so we need to use the BlockerComponent
    // to make sure the plugin is not accessible with the url
    if (pluginsToHide.indexOf('users-permissions') !== -1) {
      const blockerComponentProps = {
        blockerComponentTitle: 'Not Allowed',
        blockerComponentIcon: 'fa-ban',
        blockerComponentDescription: 'Please ask your admin',
        blockerComponentContent: '',
      };

      yield all([
        put(setHidePluginUsersPermissions()),
        put(updatePlugin('users-permissions', 'blockerComponentProps', blockerComponentProps)),
        put(updatePlugin('users-permissions', 'preventComponentRendering', true)),
      ]);
    }

    // The user model is injected by the plugin users-permission so we need to remove the link from the menu
    // if we decide to disable the CTM
    // NOTE: the same logic needs to be applied if you created a custom plugin with a model in it
    if (pluginsToHide.indexOf('content-manager') !== -1) {
      yield put(updatePlugin('users-permissions', 'leftMenuSections', []));
    }
  } catch (err) {
    console.log(err);
  }
}

function* defaultSaga() {
  yield all([
    fork(takeLatest, GET_ADMIN_DATA, getData),
    fork(takeLatest, SET_ADMIN_LAYOUT, setAdminLayout),
  ]);
}

export default defaultSaga;