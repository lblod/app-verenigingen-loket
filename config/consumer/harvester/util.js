

export async function batchedUpdate(
  lib,
  nTriples,
  targetGraph,
  sleep,
  batch,
  extraHeaders,
  endpoint,
  operation) {
  const { muAuthSudo, chunk, sparqlEscapeUri } = lib;
  console.log("size of store: ", nTriples?.length);
  const chunkedArray = chunk(nTriples, batch);
  let chunkCounter = 0;
  for (const chunkedTriple of chunkedArray) {
    console.log(`Processing chunk number ${chunkCounter} of ${chunkedArray.length} chunks.`);
    console.log(`using endpoint from utils ${endpoint}`);
    try {
      const updateQuery = `
        ${operation} DATA {
           GRAPH ${sparqlEscapeUri(targetGraph)} {
             ${chunkedTriple.join('')}
           }
        }
      `;
      console.log(`Hitting database ${endpoint} with batched query \n ${updateQuery}`);
      const connectOptions = { sparqlEndpoint: endpoint, mayRetry: true };
      console.log('connectOptions: ', connectOptions, "Extra headers: ", extraHeaders);
      await muAuthSudo.updateSudo(updateQuery, extraHeaders, connectOptions);
      console.log(`Sleeping before next query execution: ${sleep}`);
      await new Promise(r => setTimeout(r, sleep));

    }
    catch (err) {
      // Binary backoff recovery.
      console.log("ERROR: ", err);
      console.log(`Inserting the chunk failed for chunk size ${batch} and ${nTriples.length} triples`);
      const smallerBatch = Math.floor(batch / 2);
      if (smallerBatch === 0) {
        console.log("the triples that fails: ", nTriples);
        throw new Error(`Backoff mechanism stops in batched update,
          we can't work with chunks the size of ${smallerBatch}`);
      }
      console.log(`Let's try to ingest wiht chunk size of ${smallerBatch}`);
      await batchedUpdate(lib, chunkedTriple, targetGraph, sleep, smallerBatch, extraHeaders, endpoint, operation);
    }
    ++chunkCounter;
  }
}

module.exports = {
  batchedUpdate
};