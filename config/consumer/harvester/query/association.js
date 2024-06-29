const ASSOCIATION_QUERY = `INSERT {
  GRAPH ?g {
    ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging> ;
                 mu:uuid ?Auuid ;
                 skos:prefLabel ?alabel ;
                 dcterms:description ?adescription ;
                 reorg:orgStatus ?astatus ;
                 reorg:orgActivity ?activity ;
                 ns:korteNaam ?aKorteNaam ;
                 adms:identifier ?identifier ;
                 org:classification ?classificatie ;
                 verenigingen_ext:doelgroep ?doelgroep ;
                 pav:createdOn ?createdOn ;
                 pav:lastUpdateOn ?lastUpdateOn.
#ACTIVITY
    ?activity a skos:Concept ;
              mu:uuid ?activityUuid ;
              skos:notation ?activityNotation ;
              skos:prefLabel ?activityLabel .
#DOELGROEP
    ?doelgroep a verenigingen_ext:Doelgroep ;
               mu:uuid ?doelgroepUuid ;
               verenigingen_ext:minimumleeftijd ?minimum ;
               verenigingen_ext:maximumleeftijd ?maximum .
#IDENTIFIER
    ?identifier a adms:Identifier ;
                skos:notation ?identifierNotation ;
                mu:uuid ?identifierUuid ;
                generiek:gestructureerdeIdentificator ?gestructureerdeIdentificator .
    ?gestructureerdeIdentificator a generiek:GestructureerdeIdentificator ;
                                  mu:uuid ?gestructureerdeUuid ;
                                  generiek:lokaleIdentificator ?lokaleIdentificator .
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
            adres:postcode ?code ;
            adres:postnaam ?name .
  {
    GRAPH <http://mu.semte.ch/graphs/ingest> {
      ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging> ;
                   mu:uuid ?Auuid ;
                   org:hasPrimarySite ?primarySite .
      ?primarySite a org:Site ;
                   organisatie:bestaatUit ?adres .
      ?adres a <http://www.w3.org/ns/locn#Address> ;
             mu:uuid ?adUuid ;
             locn:postCode ?code .
      OPTIONAL {
        ?association skos:prefLabel ?alabel .
      }
      OPTIONAL {
        ?association dcterms:description ?adescription .
      }
      OPTIONAL {
        ?association reorg:orgStatus ?astatus .
      }
      OPTIONAL {
        ?association reorg:orgActivity ?activity .
        OPTIONAL {
          ?activity a skos:Concept ;
                    mu:uuid ?activityUuid ;
                    skos:notation ?activityNotation ;
                    skos:prefLabel ?activityLabel .
        }
      }
      OPTIONAL {
        ?association ns:korteNaam ?aKorteNaam .
      }
      OPTIONAL {
        ?association verenigingen_ext:doelgroep ?doelgroep .
        OPTIONAL {
          ?doelgroep a verenigingen_ext:Doelgroep ;
                     mu:uuid ?doelgroepUuid ;
                     verenigingen_ext:minimumleeftijd ?minimum ;
                     verenigingen_ext:maximumleeftijd ?maximum .
        }
      }
      OPTIONAL {
        ?association adms:identifier ?identifier .
        OPTIONAL {
          ?identifier a adms:Identifier ;
                      skos:notation ?identifierNotation ;
                      mu:uuid ?identifierUuid ;
                      generiek:gestructureerdeIdentificator ?gestructureerdeIdentificator .
          OPTIONAL {
            ?gestructureerdeIdentificator a generiek:GestructureerdeIdentificator ;
                                          mu:uuid ?gestructureerdeUuid ;
                                          generiek:lokaleIdentificator ?lokaleIdentificator .
          }
        }
      }
      OPTIONAL {
        ?association org:classification ?classificatie .
      }
      OPTIONAL {
        ?association pav:createdOn ?createdOn .
      }
      OPTIONAL {
        ?association pav:lastUpdateOn ?lastUpdateOn .
      }
    }
  }
}`

module.exports = {
  ASSOCIATION_QUERY,
};