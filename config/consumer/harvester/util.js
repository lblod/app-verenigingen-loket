

async function batchedUpdate(
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


async function moveToOrgGraph(muUpdate, endpoint){
  await muUpdate(`
  
  PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
  PREFIX adms:  <http://www.w3.org/ns/adms#>
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
}


module.exports = {
  batchedUpdate, 
  moveToOrgGraph
};