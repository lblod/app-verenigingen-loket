const {
  BYPASS_MU_AUTH_FOR_EXPENSIVE_QUERIES,
  DIRECT_DATABASE_ENDPOINT,
  BATCH_SIZE,
  SLEEP_BETWEEN_BATCHES,
  INGEST_GRAPH,
  MAX_DB_RETRY_ATTEMPTS,
  SLEEP_TIME_AFTER_FAILED_DB_OPERATION,
  MU_SPARQL_ENDPOINT
} = require('./config')
const { batchedDbUpdate } = require('./util')

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
  const { mu,muAuthSudo } = lib
  const { termObjectChangeSets } = data
  for (let { deletes, inserts } of termObjectChangeSets) {
    console.log(`Using ${MU_SPARQL_ENDPOINT} to insert delta triples`)

    const deleteStatements = deletes.map(
      o => `${o.subject} ${o.predicate} ${o.object}.`
    )
    await batchedDbUpdate(
      muAuthSudo.updateSudo,
      `${INGEST_GRAPH}-deletes`,
      deleteStatements,
      { 'mu-call-scope-id': "" },
      MU_SPARQL_ENDPOINT,
      BATCH_SIZE,
      MAX_DB_RETRY_ATTEMPTS,
      SLEEP_BETWEEN_BATCHES,
      SLEEP_TIME_AFTER_FAILED_DB_OPERATION
    )

    const insertStatements = inserts.map(
      o => `${o.subject} ${o.predicate} ${o.object}.`
    )
    await batchedDbUpdate(
      muAuthSudo.updateSudo,
      `${INGEST_GRAPH}-inserts`,
      insertStatements,
      { 'mu-call-scope-id': "" },
      MU_SPARQL_ENDPOINT,
      BATCH_SIZE,
      MAX_DB_RETRY_ATTEMPTS,
      SLEEP_BETWEEN_BATCHES,
      SLEEP_TIME_AFTER_FAILED_DB_OPERATION
    )
  }
}

module.exports = {
  dispatch
}
