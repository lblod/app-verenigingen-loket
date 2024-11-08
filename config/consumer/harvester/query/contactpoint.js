const CONTACTPOINT_QUERY = `INSERT {
  GRAPH ?g {
    ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#Vereniging> .
    ?association schema:contactPoint ?contactPointPhone .
    ?contactPointPhone a schema:ContactPoint ;
                       mu:uuid ?contactPointPhoneUuid ;
                       schema:telephone ?contactPhone .
    ?association schema:contactPoint ?contactPointEmail .
    ?contactPointEmail a schema:ContactPoint ;
                       mu:uuid ?contactPointEmailUuid ;
                       schema:email ?contactEmail .
    ?association schema:contactPoint ?contactPointWebsite .
    ?contactPointWebsite a schema:ContactPoint ;
                         mu:uuid ?contactPointWebsiteUuid ;
                         foaf:name ?contactName ;
                         foaf:page ?contactPage .
  }
}
WHERE {
  {
    GRAPH <http://mu.semte.ch/graphs/public> {
      ?bestuurseenheid mu:uuid ?adminUnitUuid ;
                       org:classification/skos:prefLabel "Gemeente" ;
                       besluit:werkingsgebied ?werkingsgebied .
      ?werkingsgebied rdf:type ns1:Location ;
                      rdfs:label ?label ;
                      ns3:werkingsgebiedNiveau ?gemeente .
      BIND (IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?adminUnitUuid)) AS ?g)
    }
  }
  ?postInfo geo:sfWithin ?werkingsgebied ;
            a adres:Postinfo ;
            adres:postcode ?code .
  {
    GRAPH <http://mu.semte.ch/graphs/ingest> {
      ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging> ;
                   org:hasPrimarySite ?primarySite .
      ?primarySite a org:Site ;
                   organisatie:bestaatUit ?adres .
      ?adres a <http://www.w3.org/ns/locn#Address> ;
             mu:uuid ?adUuid ;
             locn:postCode ?code .
      OPTIONAL {
        ?association schema:contactPoint ?contactPointPhone .
        ?contactPointPhone a schema:ContactPoint ;
                           mu:uuid ?contactPointPhoneUuid ;
                           schema:telephone ?contactPhone .
      }
      OPTIONAL {
        ?association schema:contactPoint ?contactPointEmail .
        ?contactPointEmail a schema:ContactPoint ;
                           mu:uuid ?contactPointEmailUuid ;
                           schema:email ?contactEmail .
      }
      OPTIONAL {
        ?association schema:contactPoint ?contactPointWebsite .
        ?contactPointWebsite a schema:ContactPoint ;
                             mu:uuid ?contactPointWebsiteUuid ;
                             foaf:name ?contactName ;
                             foaf:page ?contactPage .
      }
    }
  }
}`

module.exports = {
  CONTACTPOINT_QUERY,
};
