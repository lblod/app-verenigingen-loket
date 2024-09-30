const SITE_QUERY = `INSERT {
  GRAPH ?g {
    ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#Vereniging> ;
                 org:hasSite ?site ;
                 org:hasPrimarySite ?primarySite .
    ?primarySite a org:Site ;
                 organisatie:bestaatUit ?adres ;
                 dcterms:description ?pDes ;
                 ere:vestigingstype ?pSiteType ;
                 mu:uuid ?Puuid .
    ?pSiteType a code:TypeVestiging ;
               mu:uuid ?pSiteTypeUuid ;
               skos:prefLabel ?pSiteTypeName .
    ?site a org:Site ;
          organisatie:bestaatUit ?sadres ;
          dcterms:description ?sDes ;
          ere:vestigingstype ?sSiteType ;
          mu:uuid ?Suuid .
    ?sSiteType a code:TypeVestiging ;
               mu:uuid ?sSiteTypeUuid ;
               skos:prefLabel ?sSiteTypeName .
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
      ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging> .
      ?association org:hasPrimarySite ?primarySite .
      ?primarySite organisatie:bestaatUit ?adres ;
                   mu:uuid ?Puuid .
      OPTIONAL {
        ?primarySite dcterms:description ?pDes .
      }
      OPTIONAL {
        ?primarySite ere:vestigingstype ?pSiteType .
        OPTIONAL {
          ?pSiteType a code:TypeVestiging ;
                     mu:uuid ?pSiteTypeUuid ;
                     skos:prefLabel ?pSiteTypeName .
        }
      }
      OPTIONAL {
        ?adres a <http://www.w3.org/ns/locn#Address> ;
               mu:uuid ?adUuid ;
               locn:postCode ?code ;
               locn:thoroughfare ?adStraatnaam ;
               adres:land ?adLand ;
               adres:gemeentenaam ?adGemeente .
        OPTIONAL {
          ?adres adres:Adresvoorstelling.busnummer ?adBusnummer .
        }
        OPTIONAL {
          ?adres adres:Adresvoorstelling.huisnummer ?adHuisnummer .
        }
        BIND (CONCAT(?adStraatnaam, " ", ?adHuisnummer, " ", ?adBusnummer, ", ", ?code, " ", ?adGemeente, ", ", ?adLand) AS ?fullAddress)
      }
      OPTIONAL {
        ?association org:hasSite ?site .
        OPTIONAL {
          ?site organisatie:bestaatUit ?sadres ;
                mu:uuid ?Suuid .
          OPTIONAL {
            ?site dcterms:description ?sDes .
          }
          OPTIONAL {
            ?site ere:vestigingstype ?sSiteType .
            OPTIONAL {
              ?sSiteType a code:TypeVestiging ;
                         mu:uuid ?sSiteTypeUuid ;
                         skos:prefLabel ?sSiteTypeName .
            }
            OPTIONAL {
              ?sadres a <http://www.w3.org/ns/locn#Address> ;
                      mu:uuid ?sadUuid ;
                      locn:postCode ?sadPostcode ;
                      locn:thoroughfare ?sadStraatnaam ;
                      adres:land ?sadLand ;
                      adres:gemeentenaam ?sadGemeente .
              OPTIONAL {
                ?sadres adres:Adresvoorstelling.busnummer ?sadBusnummer .
              }
              OPTIONAL {
                ?sadres adres:Adresvoorstelling.huisnummer ?sadHuisnummer .
              }
              BIND (CONCAT(?sadStraatnaam, " ", ?sadHuisnummer, " ", ?sadBusnummer, ", ", ?sadPostcode, " ", ?sadGemeente, ", ", ?sadLand) AS ?sadFullAddress)
            }
          }
        }
      }
    }
  }
}`;

module.exports = {
  SITE_QUERY,
};
