import React from 'react';
import ReactGA from 'react-ga';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';
import { Switch, Route } from 'react-router-dom';
import { get, includes, isFunction, map, omit } from 'lodash';
import { bindActionCreators, compose } from 'redux';
// Actions required for disabling and enabling the OverlayBlocker
import { disableGlobalOverlayBlocker, enableGlobalOverlayBlocker } from 'actions/overlayBlocker';
import { pluginLoaded, updatePlugin } from 'containers/App/actions';
import {
  makeSelectAppPlugins,
  makeSelectBlockApp,
  makeSelectIsAppLoading,
  makeSelectShowGlobalAppBlocker,
  selectHasUserPlugin,
  selectPlugins,
} from 'containers/App/selectors';
// Design
import ComingSoonPage from 'containers/ComingSoonPage';
import Content from 'containers/Content';
import LocaleToggle from 'containers/LocaleToggle';
import CTAWrapper from 'components/CtaWrapper';
import Header from 'components/Header/index';
import HomePage from 'containers/HomePage/Loadable';
import InstallPluginPage from 'containers/InstallPluginPage/Loadable';
import LeftMenu from 'containers/LeftMenu';
import ListPluginsPage from 'containers/ListPluginsPage/Loadable';
import LoadingIndicatorPage from 'components/LoadingIndicatorPage';
import Logout from 'components/Logout';
import NotFoundPage from 'containers/NotFoundPage/Loadable';
import OverlayBlocker from 'components/OverlayBlocker';
import PluginPage from 'containers/PluginPage';
import FullStory from 'components/FullStory';
// Utils
import auth from 'utils/auth';
import injectReducer from 'utils/injectReducer';
import injectSaga from 'utils/injectSaga';
import { getAdminData, setAdminLayout } from './actions';
import reducer from './reducer';
import saga from './saga';
import selectAdminPage from './selectors';
import styles from './styles.scss';

const PLUGINS_TO_BLOCK_PRODUCTION = ['content-type-builder', 'settings-manager'];

export class AdminPage extends React.Component {
  // eslint-disable-line react/prefer-stateless-function
  state = { hasAlreadyRegistereOtherPlugins: false };

  getChildContext = () => ({
    ctmAdminLayout: this.props.adminPage.ctmAdminLayout, // Add this line
    disableGlobalOverlayBlocker: this.props.disableGlobalOverlayBlocker,
    enableGlobalOverlayBlocker: this.props.enableGlobalOverlayBlocker,
    plugins: this.props.plugins,
    updatePlugin: this.props.updatePlugin,
  });

  componentDidMount() {
    this.props.getAdminData();
    this.checkLogin(this.props);
    ReactGA.initialize('UA-54313258-9');
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      adminPage: { uuid },
      location: { pathname },
      plugins,
    } = this.props;

    if (prevProps.location.pathname !== pathname) {
      this.checkLogin(this.props);

      if (uuid) {
        ReactGA.pageview(pathname);
      }
    }

    const hasAdminPath = ['users-permissions', 'hasAdminUser'];

    if (get(prevProps.plugins.toJS(), hasAdminPath) !== get(plugins.toJS(), hasAdminPath)) {
      this.checkLogin(this.props, true);
    }

    if (!this.hasUserPluginLoaded(prevProps) && this.hasUserPluginLoaded(this.props)) {
      this.checkLogin(this.props);
    }

    if (prevState.hasAlreadyRegistereOtherPlugins !== this.state.hasAlreadyRegistereOtherPlugins) {
      this.props.setAdminLayout(auth.getUserInfo());
    }
  }

  checkLogin = async (props, skipAction = false) => {
    if (props.hasUserPlugin && this.isUrlProtected(props) && !auth.getToken()) {
      if (!this.hasUserPluginLoaded(props)) {
        return;
      }

      const endPoint = this.hasAdminUser(props) ? 'login' : 'register';
      this.props.history.push(`/plugins/users-permissions/auth/${endPoint}`);
    }

    if (
      !this.isUrlProtected(props) &&
      includes(props.location.pathname, 'auth/register') &&
      this.hasAdminUser(props) &&
      !skipAction
    ) {
      this.props.history.push('/plugins/users-permissions/auth/login');
    }

    if (
      props.hasUserPlugin &&
      !this.isUrlProtected(props) &&
      !includes(props.location.pathname, 'auth/register') &&
      !this.hasAdminUser(props)
    ) {
      this.props.history.push('/plugins/users-permissions/auth/register');
    }

    if (!props.hasUserPlugin || (auth.getToken() && !this.state.hasAlreadyRegistereOtherPlugins)) {
      const pluginsToRegister = Object.keys(this.props.plugins.toJS()).filter(
        plugin => plugin !== 'email' && plugin !== 'users-permissions',
      );
      const registerPlugins = async () => {
        const register = pluginName => {
          return new Promise(async resolve => {
            const plugin = get(this.props.plugins.toJS(), pluginName, {});

            switch (true) {
              case isFunction(plugin.bootstrap) && isFunction(plugin.pluginRequirements):
                await plugin
                  .pluginRequirements(plugin)
                  .then(plugin => plugin.bootstrap(plugin))
                  .then(plugin => this.props.pluginLoaded(plugin));
                break;
              case isFunction(plugin.pluginRequirements):
                await plugin
                  .pluginRequirements(plugin)
                  .then(plugin => this.props.pluginLoaded(plu));
                break;
              case isFunction(plugin.bootstrap):
                await plugin.bootstrap(plugin).then(plugin => this.props.pluginLoaded(plu));
                break;
              default:
              // Do nothing
            }

            return resolve();
          });
        };

        return Promise.all(pluginsToRegister.map(plugin => register(plugin)));
      };

      await registerPlugins();

      this.setState({ hasAlreadyRegistereOtherPlugins: true });
    }
  };

  hasUserPluginInstalled = () => {
    const { appPlugins } = this.props;

    return appPlugins.indexOf('users-permissions') !== -1;
  };

  hasUserPluginLoaded = props =>
    typeof get(props.plugins.toJS(), ['users-permissions', 'hasAdminUser']) !== 'undefined';

  hasAdminUser = props => get(props.plugins.toJS(), ['users-permissions', 'hasAdminUser']);

  isUrlProtected = props =>
    !includes(
      props.location.pathname,
      get(props.plugins.toJS(), ['users-permissions', 'nonProtectedUrl']),
    );

  shouldDisplayLogout = () =>
    auth.getToken() && this.props.hasUserPlugin && this.isUrlProtected(this.props);

  showLeftMenu = () => !includes(this.props.location.pathname, 'users-permissions/auth/');

  showLoading = () => {
    const {
      isAppLoading,
      adminPage: { isLoading },
    } = this.props;

    return (
      isAppLoading ||
      isLoading ||
      (this.hasUserPluginInstalled() && !this.hasUserPluginLoaded(this.props))
    );
  };

  retrievePlugins = () => {
    const {
      adminPage: { currentEnvironment },
      plugins,
    } = this.props;

    if (currentEnvironment === 'production') {
      let pluginsToDisplay = plugins;
      PLUGINS_TO_BLOCK_PRODUCTION.map(
        plugin => (pluginsToDisplay = pluginsToDisplay.delete(plugin)),
      );

      return pluginsToDisplay;
    }

    return plugins;
  };

  render() {
    const { adminPage } = this.props;
    const header = this.showLeftMenu() ? <Header /> : '';
    const style = this.showLeftMenu() ? {} : { width: '100%' };

    if (this.showLoading()) {
      return <LoadingIndicatorPage />;
    }

    return (
      <div className={styles.adminPage}>
        {this.props.adminPage.uuid ? <FullStory org="GK708" /> : ''}
        {this.showLeftMenu() && (
          <LeftMenu
            hidePluginUsersPermissions={adminPage.hidePluginUsersPermissions}
            layout={adminPage.layout}
            version={adminPage.strapiVersion}
            plugins={this.retrievePlugins()}
          />
        )}
        <CTAWrapper>
          {this.shouldDisplayLogout() && <Logout />}
          <LocaleToggle isLogged={this.shouldDisplayLogout() === true} />
        </CTAWrapper>
        <div className={styles.adminPageRightWrapper} style={style}>
          {header}
          <Content {...this.props} showLeftMenu={this.showLeftMenu()}>
            <Switch>
              <Route path="/" component={HomePage} exact />
              <Route path="/plugins/:pluginId" component={PluginPage} />
              <Route path="/plugins" component={ComingSoonPage} />
              <Route path="/list-plugins" component={ListPluginsPage} exact />
              <Route path="/install-plugin" component={InstallPluginPage} exact />
              <Route path="/configuration" component={ComingSoonPage} exact />
              <Route path="" component={NotFoundPage} />
              <Route path="404" component={NotFoundPage} />
            </Switch>
          </Content>
        </div>
        <OverlayBlocker isOpen={this.props.blockApp && this.props.showGlobalAppBlocker} />
      </div>
    );
  }
}

AdminPage.childContextTypes = {
  ctmAdminLayout: PropTypes.object,
  disableGlobalOverlayBlocker: PropTypes.func,
  enableGlobalOverlayBlocker: PropTypes.func,
  plugins: PropTypes.object,
  updatePlugin: PropTypes.func,
};

AdminPage.contextTypes = {
  router: PropTypes.object.isRequired,
};

AdminPage.defaultProps = {
  adminPage: {},
  appPlugins: [],
  hasUserPlugin: true,
  isAppLoading: true,
};

AdminPage.propTypes = {
  adminPage: PropTypes.object,
  appPlugins: PropTypes.array,
  blockApp: PropTypes.bool.isRequired,
  disableGlobalOverlayBlocker: PropTypes.func.isRequired,
  enableGlobalOverlayBlocker: PropTypes.func.isRequired,
  hasUserPlugin: PropTypes.bool,
  history: PropTypes.object.isRequired,
  isAppLoading: PropTypes.bool,
  location: PropTypes.object.isRequired,
  pluginLoaded: PropTypes.func.isRequired,
  plugins: PropTypes.object.isRequired,
  showGlobalAppBlocker: PropTypes.bool.isRequired,
  updatePlugin: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  adminPage: selectAdminPage(),
  appPlugins: makeSelectAppPlugins(),
  blockApp: makeSelectBlockApp(),
  hasUserPlugin: selectHasUserPlugin(),
  isAppLoading: makeSelectIsAppLoading(),
  plugins: selectPlugins(),
  showGlobalAppBlocker: makeSelectShowGlobalAppBlocker(),
});

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      disableGlobalOverlayBlocker,
      enableGlobalOverlayBlocker,
      getAdminData,
      pluginLoaded,
      setAdminLayout,
      updatePlugin,
    },
    dispatch,
  );
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);
const withReducer = injectReducer({ key: 'adminPage', reducer });
const withSaga = injectSaga({ key: 'adminPage', saga });

export default compose(
  withReducer,
  withSaga,
  withConnect,
)(AdminPage);