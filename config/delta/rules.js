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
  ...dispatcherAssociations,
];