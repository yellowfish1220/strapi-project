module.exports = {
  admin: {
    pluginsToHide: [],
    contentTypesToHide: ['user'], // Just for the sake of the example
    contentTypesToReadOnly: ['article'],
  },
  author: {
    pluginsToHide: ['content-type-builder', 'users-permissions'],
    contentTypesToHide: ['user'],
    contentTypesToReadOnly: ['tag'],
  },
  editor: {
    pluginsToHide: ['content-type-builder', 'users-permissions'],
    contentTypesToHide: ['user', 'tag'],
    contentTypesToReadOnly: [],
  },
};