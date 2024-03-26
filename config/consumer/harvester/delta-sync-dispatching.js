const {
  BYPASS_MU_AUTH_FOR_EXPENSIVE_QUERIES,
  DIRECT_DATABASE_ENDPOINT,
  BATCH_SIZE,
  SLEEP_BETWEEN_BATCHES,
  INGEST_GRAPH
} = require('./config')
const { batchedUpdate } = require('./utils')
const endpoint = BYPASS_MU_AUTH_FOR_EXPENSIVE_QUERIES
  ? DIRECT_DATABASE_ENDPOINT
  : process.env.MU_SPARQL_ENDPOINT //Defaults to mu-auth

/**
 * Dispatch the fetched information to a target graph.
 * @param { mu, muAuthSudo, fetch } lib - The provided libraries from the host service.
 * @param { termObjectChangeSets: { deletes, inserts } } data - The fetched changes sets, which objects of serialized Terms
 *          [ {
 *              graph: "<http://foo>",
 *              subject: "<http://bar>",
 *              predicate: "<http://baz>",
 *              object: "<http://boom>^^<http://datatype>"
 *            }
 *         ]
 * @return {void} Nothing
 */
async function dispatch (lib, data) {
  const { mu } = lib
  const { termObjectChangeSets } = data

  for (let { deletes, inserts } of termObjectChangeSets) {
    if (BYPASS_MU_AUTH_FOR_EXPENSIVE_QUERIES) {
      console.warn(`Service configured to skip MU_AUTH!`)
    }
    console.log(`Using ${endpoint} to insert triples`)

    const deleteStatements = deletes.map(
      o => `${o.subject} ${o.predicate} ${o.object}.`
    )
    await batchedUpdate(
      lib,
      deleteStatements,
      INGEST_GRAPH,
      SLEEP_BETWEEN_BATCHES,
      BATCH_SIZE,
      {},
      endpoint,
      'DELETE'
    )

    const insertStatements = inserts.map(
      o => `${o.subject} ${o.predicate} ${o.object}.`
    )
    await batchedUpdate(
      lib,
      insertStatements,
      INGEST_GRAPH,
      SLEEP_BETWEEN_BATCHES,
      BATCH_SIZE,
      {},
      endpoint,
      'INSERT'
    )
  }
}

module.exports = {
  dispatch
}
