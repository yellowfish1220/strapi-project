import { createSelector } from 'reselect';

/**
* Direct selector to the homePage state domain
*/
const selectAdminPageDomain = () => state => state.get('adminPage');

/**
* Default selector used by HomePage
*/

const selectAdminPage = () => createSelector(
  selectAdminPageDomain(),
  (substate) => substate.toJS(),
);

const makeSelectAdminLayout = () => createSelector(
  selectAdminPageDomain(),
  substate => substate.get('adminLayout'),
);

export default selectAdminPage;
export { makeSelectAdminLayout };