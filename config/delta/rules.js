import dispatcherAssociations from './dispatcher-associations';

export default [
  {
    match: {},
    callback: {
      url: 'http://resource/.mu/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: "v0.0.1",
      gracePeriod: 250,
      ignoreFromSelf: true
    }
  },
  {
    match: {},
    callback: {
      url: 'http://search/update',
      method: 'POST'
    },
    options: {
      resourceFormat: "v0.0.1",
      gracePeriod: 10000,
      ignoreFromSelf: true
    }
  },
  ...dispatcherAssociations,
];