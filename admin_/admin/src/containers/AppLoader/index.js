import React from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import makeSelectApp from "containers/App/selectors";

class AppLoader extends React.Component {
  shouldLoad = () => {
    const { appPlugins, skipInitLoading, plugins: mountedPlugins } = this.props;

    if (!skipInitLoading) {
      return appPlugins.length !== Object.keys(mountedPlugins).length;
    }

    return false;
  };

  render() {
    const { children } = this.props;

    return children({ shouldLoad: this.shouldLoad() });
  }
}

AppLoader.propTypes = {
  appPlugins: PropTypes.array.isRequired,
  children: PropTypes.func.isRequired,
  skipInitLoading: PropTypes.bool.isRequired,
  plugins: PropTypes.object.isRequired
};

const mapStateToProps = makeSelectApp();

export default connect(
  mapStateToProps,
  null
)(AppLoader);