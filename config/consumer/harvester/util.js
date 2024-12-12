const { PREFIXES } = require("./query/prefix");
const { ASSOCIATION_QUERY } = require("./query/association");
const { MEMBERSHIP_QUERY } = require("./query/membership");
const { CONTACTPOINT_QUERY } = require("./query/contactpoint");
const { SITE_QUERY } = require("./query/site");
const { ACTIVITIES_QUERY } = require("./query/activities");


async function batchedDbUpdate(
  muUpdate,
  graph,
  triples,
  extraHeaders,
  endpoint,
  batchSize,
  maxAttempts,
  sleepBetweenBatches = 1000,
  sleepTimeOnFail = 1000,
  operation = 'INSERT'
) {
  for (let i = 0; i < triples.length; i += batchSize) {
    console.log(`Inserting triples in batch: ${i}-${i + batchSize}`);

    const batch = triples.slice(i, i + batchSize).join('\n');

    console.log({ batch, triples });

    const insertCall = async () => {
      await muUpdate(`
      ${operation} DATA {
      GRAPH <${graph}> {
      ${batch}
      }
      }
`, extraHeaders, { sparqlEndpoint: endpoint });
    };

    await operationWithRetry(insertCall, 0, maxAttempts, sleepTimeOnFail);

    console.log(`Sleeping before next query execution: ${sleepBetweenBatches}`);
    await new Promise(r => setTimeout(r, sleepBetweenBatches));
  }
}




async function operationWithRetry(callback,
  attempt,
  maxAttempts,
  sleepTimeOnFail) {
  try {
    if (typeof callback === "function")
      return await callback();
    else // Catch error from promise - not how I would do it normally, but allows re use of existing code.
      return await callback;
  }
  catch (e) {
    console.log(`Operation failed for ${callback.toString()}, attempt: ${attempt} of ${maxAttempts}`);
    console.log(`Error: ${e}`);
    console.log(`Sleeping ${sleepTimeOnFail} ms`);

    if (attempt >= maxAttempts) {
      console.log(`Max attempts reached for ${callback.toString()}, giving up`);
      throw e;
    }

    await new Promise(r => setTimeout(r, sleepTimeOnFail));
    return operationWithRetry(callback, ++attempt, maxAttempts, sleepTimeOnFail);
  }
}




async function moveToOrgGraph(muUpdate, extraHeaders, endpoint) {
  await muUpdate(
    `${PREFIXES}
     ${ASSOCIATION_QUERY}
    `,
    extraHeaders,
    { sparqlEndpoint: endpoint }
  )
  // MEMBERSHIP
  await muUpdate(
    `${PREFIXES}
       ${MEMBERSHIP_QUERY}
      `,
    extraHeaders,
    { sparqlEndpoint: endpoint }
  )
  // CONTACTPOINT
  await muUpdate(
    `${PREFIXES}
     ${CONTACTPOINT_QUERY}
    `,
    extraHeaders,
    { sparqlEndpoint: endpoint }
  )
  // SITES
  await muUpdate(
    `
${PREFIXES}
${SITE_QUERY}
    `,
    extraHeaders,
    { sparqlEndpoint: endpoint }
  )
  // ACTIVITIES
  await muUpdate(
    `
${PREFIXES}
${ACTIVITIES_QUERY}
   `,
    extraHeaders,
    { sparqlEndpoint: endpoint }
  )
}

module.exports = {
  batchedDbUpdate,
  moveToOrgGraph
}
