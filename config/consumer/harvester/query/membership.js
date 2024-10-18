const MEMBERSHIP_QUERY = `INSERT {
  GRAPH ?g {
    ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#Vereniging> ;
                 org:hasMembership ?membership .
    ?membership a org:Membership ;
                mu:uuid ?membershipUuid ;
                org:member ?person .
    ?person a person:Person ;
            mu:uuid ?personUuid ;
            foaf:givenName ?personGivenName ;
            foaf:familyName ?personFamilyName .
    ?person schema:contactPoint ?contactMemberPhone .
    ?contactMemberPhone a schema:ContactPoint ;
                        mu:uuid ?contactMemberPhoneUuid ;
                        schema:telephone ?contactMemberTelephone .
    ?person schema:contactPoint ?contactMemberEmail .
    ?contactMemberEmail a schema:ContactPoint ;
                        mu:uuid ?contactMemberEmailUuid ;
                        schema:email ?contactMemberEmails .
    ?person schema:contactPoint ?contactMemberSocialMedia .
    ?contactMemberSocialMedia a schema:ContactPoint ;
                              mu:uuid ?contactMemberSocialMediaUuid ;
                              foaf:page ?contactMemberPage .
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
        ?association org:hasMembership ?membership .
        OPTIONAL {
          ?membership a org:Membership ;
                      mu:uuid ?membershipUuid ;
                      org:member ?person .
          OPTIONAL {
            ?person a person:Person ;
                    mu:uuid ?personUuid ;
                    foaf:givenName ?personGivenName ;
                    foaf:familyName ?personFamilyName .
          }
          OPTIONAL {
            ?person schema:contactPoint ?contactMemberPhone .
            ?contactMemberPhone a schema:ContactPoint ;
                                mu:uuid ?contactMemberPhoneUuid ;
                                schema:telephone ?contactMemberTelephone .
          }
          OPTIONAL {
            ?person schema:contactPoint ?contactMemberEmail .
            ?contactMemberEmail a schema:ContactPoint ;
                                mu:uuid ?contactMemberEmailUuid ;
                                schema:email ?contactMemberEmails .
          }
          OPTIONAL {
            ?person schema:contactPoint ?contactMemberSocialMedia .
            ?contactMemberSocialMedia a schema:ContactPoint ;
                                      mu:uuid ?contactMemberSocialMediaUuid ;
                                      foaf:page ?contactMemberPage .
          }
        }
      }
    }
  }
}`;

module.exports = {
  MEMBERSHIP_QUERY,
};
