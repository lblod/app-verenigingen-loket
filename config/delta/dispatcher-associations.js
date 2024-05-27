export default [
    {
      match: {
        graph: {
          type: 'uri',
          value: 'http://mu.semte.ch/graphs/ingest-inserts'
        }
      },
      callback: {
        url: 'http://dispatcher-associations/delta-inserts',
        method: 'POST'
      },
      options: {
        resourceFormat: 'v0.0.1',
        gracePeriod: 1000,
        ignoreFromSelf: true,
        optOutMuScopeIds: [ "http://associations-graph-dispatcher/update" ]
      }
    },
    {
      match: {
        graph: {
          type: 'uri',
          value: 'http://mu.semte.ch/graphs/ingest-deletes'
        }
      },
      callback: {
        url: 'http://dispatcher-associations/delta-deletes',
        method: 'POST'
      },
      options: {
        resourceFormat: 'v0.0.1',
        gracePeriod: 1000,
        ignoreFromSelf: true,
        optOutMuScopeIds: [ "http://associations-graph-dispatcher/update" ]
      }
    },
  ];
