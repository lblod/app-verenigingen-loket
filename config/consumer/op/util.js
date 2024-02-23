const {
  MAX_DB_RETRY_ATTEMPTS,
  SLEEP_BETWEEN_BATCHES,
  SLEEP_TIME_AFTER_FAILED_DB_OPERATION,
  LANDING_ZONE_GRAPH,
  BATCH_SIZE,
} = require('./config');

const prefixes = `
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX lblodgeneriek: <https://data.lblod.info/vocabularies/generiek/>
PREFIX org: <http://www.w3.org/ns/org#>
PREFIX code: <http://lblod.data.gift/vocabularies/organisatie/>
PREFIX adms: <http://www.w3.org/ns/adms#>
PREFIX generiek: <https://data.vlaanderen.be/ns/generiek#>
PREFIX ere: <http://data.lblod.info/vocabularies/erediensten/>
PREFIX organisatie: <https://data.vlaanderen.be/ns/organisatie#>
PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
PREFIX euvoc: <http://publications.europa.eu/ontology/euvoc#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX schema: <http://schema.org/>
PREFIX locn: <http://www.w3.org/ns/locn#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX ext:<http://mu.semte.ch/vocabularies/ext/>
PREFIX dcterms: <http://purl.org/dc/terms/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX adres: <https://data.vlaanderen.be/ns/adres#>
`

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


async function insertIntoPublicGraph(lib, statements) {
  console.log(`Inserting ${statements.length} statements into public graph`);

  await batchedDbUpdate(
    lib.muAuthSudo.updateSudo,
    'http://mu.semte.ch/graphs/public',
    statements,
    {},
    process.env.MU_SPARQL_ENDPOINT,
    BATCH_SIZE,
    MAX_DB_RETRY_ATTEMPTS,
    SLEEP_BETWEEN_BATCHES,
    SLEEP_TIME_AFTER_FAILED_DB_OPERATION,
    'INSERT');
}

async function insertIntoSpecificGraphs(lib, statementsWithGraphs) {

  for( let graph in statementsWithGraphs) {
    console.log(`Inserting ${statementsWithGraphs[graph].length} statements into ${graph} graph`);
    await batchedDbUpdate(
      lib.muAuthSudo.updateSudo,
      graph,
      statementsWithGraphs[graph],
      {},
      process.env.MU_SPARQL_ENDPOINT,
      BATCH_SIZE,
      MAX_DB_RETRY_ATTEMPTS,
      SLEEP_BETWEEN_BATCHES,
      SLEEP_TIME_AFTER_FAILED_DB_OPERATION,
      'INSERT');
  }

}

async function deleteFromPublicGraph(lib, statements) {
  console.log(`Deleting ${statements.length} statements from public graph`);

  await batchedDbUpdate(
    lib.muAuthSudo.updateSudo,
    'http://mu.semte.ch/graphs/public',
    statements,
    {},
    process.env.MU_SPARQL_ENDPOINT,
    BATCH_SIZE,
    MAX_DB_RETRY_ATTEMPTS,
    SLEEP_BETWEEN_BATCHES,
    SLEEP_TIME_AFTER_FAILED_DB_OPERATION,
    'DELETE');
}

async function deleteFromSpecificGraphs(lib, statementsWithGraphs) {


  for( let graph in statementsWithGraphs) {
    console.log(`Deleting ${statementsWithGraphs[graph].length} statements from ${graph} graph`);
    await batchedDbUpdate(
      lib.muAuthSudo.updateSudo,
      graph,
      statementsWithGraphs[graph],
      {},
      process.env.MU_SPARQL_ENDPOINT,
      BATCH_SIZE,
      MAX_DB_RETRY_ATTEMPTS,
      SLEEP_BETWEEN_BATCHES,
      SLEEP_TIME_AFTER_FAILED_DB_OPERATION,
      'DELETE');
  }

}

async function moveToPublic(muUpdate, endpoint) {
  console.log('moving to public')
  await moveTypeToPublic(muUpdate, endpoint, 'code:BestuurseenheidClassificatieCode')
  await moveTypeToPublic(muUpdate, endpoint, 'besluit:Bestuurseenheid')
}

async function moveTypeToPublic(muUpdate, endpoint, type) {
  await muUpdate(`
    ${prefixes}
    INSERT {
      GRAPH <http://mu.semte.ch/graphs/public> {
        ?subject a ${type};
          ?pred ?obj.
      }
    }
    WHERE {
      ?subject a ${type};
          ?pred ?obj.
    }
  `, undefined, endpoint)
}


async function moveToOrganizationsGraph(muUpdate, endpoint) {
  //Move identifiers
  await muUpdate(`
    ${prefixes}
    INSERT {
      GRAPH <http://mu.semte.ch/graphs/public> {
        ?bestuurseenheid a besluit:Bestuurseenheid;
        ?x ?y ;
        org:classification ?cl .
        ?cl skos:prefLabel "Gemeente" ;
        a <http://lblod.data.gift/vocabularies/organisatie/BestuurseenheidClassificatieCode> .
      }
    }
    WHERE {
        ?bestuurseenheid a besluit:Bestuurseenheid;
        ?x ?y ;
        org:classification ?cl .
        ?cl skos:prefLabel "Gemeente" ;
        a <http://lblod.data.gift/vocabularies/organisatie/BestuurseenheidClassificatieCode> .
    }
  `, undefined, endpoint)

  //Create mock users
  await muUpdate(`
    ${prefixes}
    INSERT {
      GRAPH  <http://mu.semte.ch/graphs/public> {
        ?persoon a foaf:Person;
                mu:uuid ?uuidPersoon;
                foaf:firstName ?classificatie;
                foaf:familyName ?naam;
                foaf:member ?bestuurseenheid;
                foaf:account ?account.
        ?account a foaf:OnlineAccount;
                mu:uuid ?uuidAccount;
                foaf:accountServiceHomepage <https://github.com/lblod/mock-login-service>;
                ext:sessionRole "LoketLB-verenigingenGebruiker" .
      }
      GRAPH ?g {
        ?persoon a foaf:Person;
                mu:uuid ?uuidPersoon;
                foaf:firstName ?classificatie;
                foaf:familyName ?naam;
                foaf:member ?bestuurseenheid;
                foaf:account ?account.
        ?account a foaf:OnlineAccount;
                mu:uuid ?uuidAccount;
                foaf:accountServiceHomepage <https://github.com/lblod/mock-login-service>;
                ext:sessionRole "LoketLB-verenigingenGebruiker" .
      }
    }
    WHERE {
        ?bestuurseenheid a besluit:Bestuurseenheid;
          skos:prefLabel ?naam;
          mu:uuid ?adminUnitUuid;
          org:classification/skos:prefLabel ?classificatie.
        BIND(CONCAT(?classificatie, " ", ?naam) as ?volledigeNaam)
        BIND(MD5(?adminUnitUuid) as ?uuidPersoon)
        BIND(MD5(CONCAT(?adminUnitUuid,"ACCOUNT")) as ?uuidAccount)
        BIND(IRI(CONCAT("http://data.lblod.info/id/persoon/", ?uuidPersoon)) AS ?persoon)
        BIND(IRI(CONCAT("http://data.lblod.info/id/account/", ?uuidAccount)) AS ?account)
    }
  `, undefined, endpoint)

  //Create mock users
  await muUpdate(`
    ${prefixes}
  INSERT {
    GRAPH ?g {
      ?persoon a foaf:Person;
              mu:uuid ?uuidPersoon;
              foaf:firstName ?classificatie;
              foaf:familyName ?naam;
              foaf:member ?bestuurseenheid;
              foaf:account ?account.
      ?account a foaf:OnlineAccount;
              mu:uuid ?uuidAccount;
              foaf:accountServiceHomepage <https://github.com/lblod/mock-login-service>;
              ext:sessionRole "LoketLB-verenigingenGebruiker".
    }
    }
    WHERE {
    ?bestuurseenheid mu:uuid ?adminUnitUuid.
    ?persoon a foaf:Person;
              mu:uuid ?uuidPersoon;
              foaf:firstName ?classificatie;
              foaf:familyName ?naam;
              foaf:member ?bestuurseenheid;
              foaf:account ?account.
      ?account a foaf:OnlineAccount;
              mu:uuid ?uuidAccount;
              foaf:accountServiceHomepage <https://github.com/lblod/mock-login-service>;
              ext:sessionRole "LoketLB-verenigingenGebruiker" .
    BIND(IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?adminUnitUuid)) AS ?g)
    }
    `, undefined, endpoint)
}

async function transformLandingZoneGraph(fetch, endpoint, mapping = 'main') {
  console.log(`Transforming landing zone graph: ${LANDING_ZONE_GRAPH}`);

  try {
  const response = await fetch(`http://reasoner/reason/op2verenigingen/${mapping}?data=${encodeURIComponent(`${endpoint}?default-graph-uri=&query=CONSTRUCT+%7B%0D%0A%3Fs+%3Fp+%3Fo%0D%0A%7D+WHERE+%7B%0D%0A+GRAPH+<${LANDING_ZONE_GRAPH}>+%7B%0D%0A%3Fs+%3Fp+%3Fo%0D%0A%7D%0D%0A%7D&should-sponge=&format=text%2Fplain&timeout=0&run=+Run+Query`)}`);
  const text = await response.text();
  const statements = text.replace(/\n{2,}/g, '').split('\n');

  return statements;
  } catch(e) {
    console.log("ERROR:", e);
  }
}

async function moveToTestGraph(muUpdate, endpoint){
  await muUpdate(`
  ${prefixes}
  DELETE {
  GRAPH  <http://mu.semte.ch/graphs/public> {
            ?association
                        ?x ?y .
  }
  } INSERT {
        GRAPH ?g {
                ?association
                        ?x ?y .

                ?werkingsgebied
                        ?p ?o .
        }
  }
  WHERE {
        ?bestuurseenheid
                mu:uuid ?adminUnitUuid;
                org:classification/skos:prefLabel "Gemeente" ;
                besluit:werkingsgebied ?werkingsgebied .

        ?werkingsgebied
                ?p ?o .

        ?postInfo
                geo:sfWithin ?werkingsgebied;
                ?p2 ?o2 ;
                adres:postcode ?code ;
                adres:postnaam ?name .

        ?association
                a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging>  ;
                ?x ?y ;
                org:hasPrimarySite ?primarySite .

        ?primarySite
                organisatie:bestaatUit ?address .

        ?address
                locn:postCode ?code .


        BIND(IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?adminUnitUuid)) AS ?g)
  }
`, undefined, endpoint)

await muUpdate(`
${prefixes}
DELETE {
  GRAPH  <http://mu.semte.ch/graphs/public> {
             ?postInfo
                 a adres:Postinfo ;
                 geo:sfWithin ?werkingsgebied ;
                 adres:postcode ?code ;
                adres:postnaam ?name . 
  }
} INSERT {
        GRAPH ?g {
                ?werkingsgebied
                        ?p ?o .

                ?postInfo
                        geo:sfWithin ?werkingsgebied;
                        ?p2 ?o2.
        }
}
WHERE {
        ?bestuurseenheid
                mu:uuid ?adminUnitUuid;
                org:classification/skos:prefLabel "Gemeente" ;
                besluit:werkingsgebied ?werkingsgebied .

        ?werkingsgebied
                ?p ?o .

        ?postInfo
                geo:sfWithin ?werkingsgebied;
                ?p2 ?o2 ;
                adres:postcode ?code ;
                adres:postnaam ?name .

        BIND(IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?adminUnitUuid)) AS ?g)
}
`)
}

module.exports = {
  batchedDbUpdate,
  moveToOrganizationsGraph,
  moveToPublic,
  insertIntoPublicGraph,
  deleteFromPublicGraph,
  insertIntoSpecificGraphs,
  deleteFromSpecificGraphs,
  transformLandingZoneGraph,
  moveToTestGraph
};
