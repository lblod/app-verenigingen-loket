async function batchedUpdate (
  lib,
  nTriples,
  targetGraph,
  sleep,
  batch,
  extraHeaders,
  endpoint,
  operation
) {
  const { muAuthSudo, chunk, sparqlEscapeUri } = lib
  console.log('size of store: ', nTriples?.length)
  const chunkedArray = chunk(nTriples, batch)
  let chunkCounter = 0
  for (const chunkedTriple of chunkedArray) {
    console.log(
      `Processing chunk number ${chunkCounter} of ${chunkedArray.length} chunks.`
    )
    console.log(`using endpoint from utils ${endpoint}`)
    try {
      const updateQuery = `
        ${operation} DATA {
           GRAPH ${sparqlEscapeUri(targetGraph)} {
             ${chunkedTriple.join('')}
           }
        }
      `
      console.log(
        `Hitting database ${endpoint} with batched query \n ${updateQuery}`
      )
      const connectOptions = { sparqlEndpoint: endpoint, mayRetry: true }
      console.log(
        'connectOptions: ',
        connectOptions,
        'Extra headers: ',
        extraHeaders
      )
      await muAuthSudo.updateSudo(updateQuery, extraHeaders, connectOptions)
      console.log(`Sleeping before next query execution: ${sleep}`)
      await new Promise(r => setTimeout(r, sleep))
    } catch (err) {
      // Binary backoff recovery.
      console.log('ERROR: ', err)
      console.log(
        `Inserting the chunk failed for chunk size ${batch} and ${nTriples.length} triples`
      )
      const smallerBatch = Math.floor(batch / 2)
      if (smallerBatch === 0) {
        console.log('the triples that fails: ', nTriples)
        throw new Error(`Backoff mechanism stops in batched update,
          we can't work with chunks the size of ${smallerBatch}`)
      }
      console.log(`Let's try to ingest wiht chunk size of ${smallerBatch}`)
      await batchedUpdate(
        lib,
        chunkedTriple,
        targetGraph,
        sleep,
        smallerBatch,
        extraHeaders,
        endpoint,
        operation
      )
    }
    ++chunkCounter
  }
}

async function moveToOrgGraph (muUpdate, endpoint) {
  await muUpdate(
    `PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
    PREFIX adms:  <http://www.w3.org/ns/adms#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX reorg: <http://www.w3.org/ns/regorg#>
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
    PREFIX ns1:	<http://www.w3.org/ns/prov#> 
    PREFIX ns3:	<http://mu.semte.ch/vocabularies/ext/> 
    PREFIX rdfs:	<http://www.w3.org/2000/01/rdf-schema#> 
    PREFIX fv: <http://data.lblod.info/vocabularies/FeitelijkeVerenigingen/>
    PREFIX ns: <https://data.lblod.info/ns/>
    PREFIX verenigingen_ext: <http://data.lblod.info/vocabularies/FeitelijkeVerenigingen/>
    PREFIX pav: <http://purl.org/pav/>


    
   INSERT {
          GRAPH ?g {

            ?association
                  a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging>  ;
                  mu:uuid ?Auuid ;
                  skos:prefLabel ?alabel ;
                  dcterms:description ?adescription ;
                  adms:identifier ?aidentifier ;
                  reorg:orgStatus ?astatus ;
                  reorg:orgActivity ?activity ;
                  ns:korteNaam ?aKorteNaam ;
                  adms:identifier ?identifier ;
                  org:classification ?classificatie ;
                  verenigingen_ext:doelgroep ?doelgroep ;
                  pav:createdOn ?createdOn .

          ?activity a skos:Concept ;
                  mu:uuid ?activityUuid ;
                  skos:notation ?activityNotation ;
                  skos:prefLabel ?activityLabel .

           ?doelgroep a verenigingen_ext:Doelgroep ;
                  mu:uuid ?doelgroepUuid ;
                  verenigingen_ext:minimumleeftijd ?minimum ;
                  verenigingen_ext:maximumleeftijd ?maximum .
            

            ?identifier a adms:Identifier;
                       skos:notation ?identifierNotation;
                       mu:uuid ?identifierUuid;
                       generiek:gestructureerdeIdentificator ?gestructureerdeIdentificator . 

           ?gestructureerdeIdentificator a generiek:GestructureerdeIdentificator;
                       mu:uuid ?gestructureerdeUuid ;
                       generiek:lokaleIdentificator ?lokaleIdentificator. 
            
             
          }
    }
    
    
    WHERE {
    
        {graph <http://mu.semte.ch/graphs/public> {
              ?bestuurseenheid
                  mu:uuid ?adminUnitUuid;
                  org:classification/skos:prefLabel "Gemeente" ;
                  besluit:werkingsgebied ?werkingsgebied .
    
          ?werkingsgebied
            rdf:type	ns1:Location ;
	          rdfs:label	?label ;
	          ns3:werkingsgebiedNiveau ?gemeente .
    
    }}
    
          ?postInfo
                  geo:sfWithin ?werkingsgebied;
                  a adres:Postinfo ;
                  adres:postcode ?code ;
                  adres:postnaam ?name .
    
    { graph  <http://mu.semte.ch/graphs/ingest> {
          ?association
                  mu:uuid ?Auuid ;
                  skos:prefLabel ?alabel ;
                  dcterms:description ?adescription ;
                  adms:identifier ?aidentifier ;
                  reorg:orgStatus ?astatus ;
                  reorg:orgActivity ?activity ;
                  ns:korteNaam ?aKorteNaam ;
                  org:hasSite ?site ;
                  verenigingen_ext:doelgroep ?doelgroep ;
                  adms:identifier ?identifier ;
                  org:classification ?classificatie ;
                  pav:createdOn ?createdOn ;
                  org:hasPrimarySite ?primarySite .

          ?activity a skos:Concept ;
                  mu:uuid ?activityUuid ;
                  skos:notation ?activityNotation ;
                  skos:prefLabel ?activityLabel .


           ?doelgroep a verenigingen_ext:Doelgroep ;
                  mu:uuid ?doelgroepUuid ;
                  verenigingen_ext:minimumleeftijd ?minimum ;
                  verenigingen_ext:maximumleeftijd ?maximum .
    
          ?primarySite
                 organisatie:bestaatUit ?adres .
                 
       
          
          ?adres a <http://www.w3.org/ns/locn#Address> ;
                 locn:postCode ?code .

           ?identifier a adms:Identifier;
                       skos:notation ?identifierNotation;
                       mu:uuid ?identifierUuid;
                       generiek:gestructureerdeIdentificator ?gestructureerdeIdentificator . 

           ?gestructureerdeIdentificator a generiek:GestructureerdeIdentificator;
                       mu:uuid ?gestructureerdeUuid ;
                       generiek:lokaleIdentificator ?lokaleIdentificator. 
    }}
    
          BIND(IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?adminUnitUuid)) AS ?g)

    }
     `,
    undefined,
    endpoint
  )

  await muUpdate(
    `PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
    PREFIX adms:  <http://www.w3.org/ns/adms#>
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    PREFIX reorg: <http://www.w3.org/ns/regorg#>
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
    PREFIX ns1:	<http://www.w3.org/ns/prov#> 
    PREFIX ns3:	<http://mu.semte.ch/vocabularies/ext/> 
    PREFIX rdfs:	<http://www.w3.org/2000/01/rdf-schema#> 
    PREFIX fv: <http://data.lblod.info/vocabularies/FeitelijkeVerenigingen/>
    PREFIX ns: <https://data.lblod.info/ns/>
    PREFIX verenigingen_ext: <http://data.lblod.info/vocabularies/FeitelijkeVerenigingen/>
    PREFIX pav: <http://purl.org/pav/>


    
   INSERT {
          GRAPH ?g {

            ?association
                  a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging>  ;
                  org:hasSite ?site ;
                  org:hasPrimarySite ?primarySite .

            
           ?primarySite
                 a org:Site ;
                 organisatie:bestaatUit ?adres ;
                 dcterms:description ?pDes ;
                 mu:uuid ?Puuid .
                 
          ?site
                 a org:Site ;
                 organisatie:bestaatUit ?sadres ;
                 dcterms:description ?sDes ;
                 mu:uuid ?Suuid .
          
          ?adres a <http://www.w3.org/ns/locn#Address> ;
                 mu:uuid ?adUuid ;
                 locn:postCode ?code ;
                 locn:thoroughfare ?adStraatnaam ;
                 adres:Adresvoorstelling.busnummer ?adBusnummer ;
                 adres:Adresvoorstelling.huisnummer ?adHuisnummer ;
                 adres:land ?adLand ;
                 locn:fullAddress ?fullAddress ;
                 adres:gemeentenaam ?adGemeente .

          ?sadres a <http://www.w3.org/ns/locn#Address> ;
                 mu:uuid ?sadUuid ;
                 locn:postCode ?sadPostcode ;
                 locn:thoroughfare ?sadStraatnaam ;
                 adres:Adresvoorstelling.busnummer ?sadBusnummer ;
                 adres:Adresvoorstelling.huisnummer ?sadHuisnummer ;
                 adres:land ?sadLand ;
                 locn:fullAddress ?sadFullAddress ;
                 adres:gemeentenaam ?sadGemeente .
          }
    }
    
    
    WHERE {
    
        {graph <http://mu.semte.ch/graphs/public> {
              ?bestuurseenheid
                  mu:uuid ?adminUnitUuid;
                  org:classification/skos:prefLabel "Gemeente" ;
                  besluit:werkingsgebied ?werkingsgebied .
    
          ?werkingsgebied
            rdf:type	ns1:Location ;
	          rdfs:label	?label ;
	          ns3:werkingsgebiedNiveau ?gemeente .
    
    }}
    
          ?postInfo
                  geo:sfWithin ?werkingsgebied;
                  a adres:Postinfo ;
                  adres:postcode ?code ;
                  adres:postnaam ?name .
    
    { graph  <http://mu.semte.ch/graphs/ingest> {
          ?association
                  org:hasSite ?site ;
                  org:hasPrimarySite ?primarySite .

    
          ?primarySite
                 organisatie:bestaatUit ?adres ;
                 ns:description ?pDes ;
                 mu:uuid ?Puuid .
                 
          ?site
                 organisatie:bestaatUit ?sadres ;
                 ns:description ?sDes ;
                 mu:uuid ?Suuid .
          
          ?adres a <http://www.w3.org/ns/locn#Address> ;
                 mu:uuid ?adUuid ;
                 locn:postCode ?code ;
                 ns:straatnaam ?adStraatnaam ;
                 ns:busnummer ?adBusnummer ;
                 ns:huisnummer ?adHuisnummer ;
                 ns:land ?adLand ;
                 adres:gemeentenaam ?adGemeente .

          BIND(CONCAT(?adStraatnaam, " ", ?adHuisnummer, " ", ?adBusnummer, ", ", ?code," ", ?adGemeente, ", ", ?adLand) AS ?fullAddress)

          ?sadres a <http://www.w3.org/ns/locn#Address> ;
                 mu:uuid ?sadUuid ;
                 locn:postCode ?sadPostcode ;
                 ns:straatnaam ?sadStraatnaam ;
                 ns:busnummer ?sadBusnummer ;
                 ns:huisnummer ?sadHuisnummer ;
                 ns:land ?sadLand ;
                 adres:gemeentenaam ?sadGemeente .

        BIND(CONCAT(?sadStraatnaam, " ", ?sadHuisnummer, " ", ?sadBusnummer, ", ", ?sadPostcode," ", ?sadGemeente, ", ", ?sadLand) AS ?sadFullAddress)
            
    }}
    
          BIND(IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?adminUnitUuid)) AS ?g)

    }
     `,
    undefined,
    endpoint
  )
}

module.exports = {
  batchedUpdate,
  moveToOrgGraph
}
