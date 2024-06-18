const {PREFIXES} = require("./query/prefix");
const {ASSOCIATION_QUERY} = require("./query/association");
const {MEMBERSHIP_QUERY} = require("./query/membership");
const {CONTACTPOINT_QUERY} = require("./query/contactpoint");
const {SITE_QUERY} = require("./query/site");


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

    console.log({batch, triples});

    const insertCall = async () => {
      await muUpdate(`
      ${operation} DATA {
      GRAPH <${graph}> {
      ${batch}
      }
      }
`, extraHeaders, endpoint);
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




async function moveToOrgGraph(muUpdate, endpoint) {
  await muUpdate(
     `${PREFIXES}
     ${ASSOCIATION_QUERY}
    `,
     undefined,
     endpoint
  )
  // MEMBERSHIP
  await muUpdate(
     `${PREFIXES}
       ${MEMBERSHIP_QUERY}
      `,
     undefined,
     endpoint
  )
  // CONTACTPOINT
  await muUpdate(
     `${PREFIXES}
     ${CONTACTPOINT_QUERY}
    `,
     undefined,
     endpoint
  )
  // SITES
  await muUpdate(
     `
${PREFIXES}
${SITE_QUERY}
    `,
     undefined,
     endpoint
  )
}

module.exports = {
  batchedDbUpdate,
  moveToOrgGraph
}
