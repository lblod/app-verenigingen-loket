
const PREFIXES = `
    PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
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
    PREFIX code: <http://data.vlaanderen.be/id/concept/>
    PREFIX person: <http://www.w3.org/ns/person#>
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




async function moveToOrgGraph (muUpdate, endpoint) {
  await muUpdate(
    `${PREFIXES}
INSERT {
  GRAPH ?g {
    ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging> ;
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
                 pav:createdOn ?createdOn ;
                 org:hasMembership ?membership .
#CONTACTPOINT
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
#MEMBERSHIP
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
      ?postInfo geo:sfWithin ?werkingsgebied ;
                a adres:Postinfo ;
                adres:postcode ?code ;
                adres:postnaam ?name .
      BIND (IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?adminUnitUuid)) AS ?g)
    }
  }
  {
    GRAPH <http://mu.semte.ch/graphs/ingest> {
      ?association mu:uuid ?Auuid ;
                   org:hasPrimarySite ?primarySite .
      OPTIONAL {
        ?association skos:prefLabel ?alabel .
      }
      OPTIONAL {
        ?association dcterms:description ?adescription .
      }
      OPTIONAL {
        ?association adms:identifier ?aidentifier .
      }
      OPTIONAL {
        ?association reorg:orgStatus ?astatus .
      }
      OPTIONAL {
        ?association reorg:orgActivity ?activity .
      }
      OPTIONAL {
        ?association ns:korteNaam ?aKorteNaam .
      }
      OPTIONAL {
        ?association org:hasSite ?site .
      }
      OPTIONAL {
        ?association verenigingen_ext:doelgroep ?doelgroep .
      }
      OPTIONAL {
        ?association adms:identifier ?identifier .
      }
      OPTIONAL {
        ?association org:classification ?classificatie .
      }
      OPTIONAL {
        ?association pav:createdOn ?createdOn .
      }
      OPTIONAL {
        ?association org:hasMembership ?membership .
      }
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
      OPTIONAL {
        ?activity a skos:Concept ;
                  mu:uuid ?activityUuid ;
                  skos:notation ?activityNotation ;
                  skos:prefLabel ?activityLabel .
      }
      OPTIONAL {
        ?doelgroep a verenigingen_ext:Doelgroep ;
                   mu:uuid ?doelgroepUuid ;
                   verenigingen_ext:minimumleeftijd ?minimum ;
                   verenigingen_ext:maximumleeftijd ?maximum .
      }
      ?primarySite organisatie:bestaatUit ?adres .
      ?adres a <http://www.w3.org/ns/locn#Address> ;
             locn:postCode ?code .
      OPTIONAL {
        ?identifier a adms:Identifier ;
                    skos:notation ?identifierNotation ;
                    mu:uuid ?identifierUuid ;
                    generiek:gestructureerdeIdentificator ?gestructureerdeIdentificator .
      }
      OPTIONAL {
        ?gestructureerdeIdentificator a generiek:GestructureerdeIdentificator ;
                                      mu:uuid ?gestructureerdeUuid ;
                                      generiek:lokaleIdentificator ?lokaleIdentificator .
      }
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
     `,
    undefined,
    endpoint
  )

  await muUpdate(
    `
${PREFIXES}
INSERT {
  GRAPH ?g {
    ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging> ;
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
      ?postInfo geo:sfWithin ?werkingsgebied ;
                a adres:Postinfo ;
                adres:postcode ?code ;
                adres:postnaam ?name .
      BIND (IRI(CONCAT("http://mu.semte.ch/graphs/organizations/", ?adminUnitUuid)) AS ?g)
    }
  }
  {
    GRAPH <http://mu.semte.ch/graphs/ingest> {
      ?association a <https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging> .
      ?association org:hasPrimarySite ?primarySite .
      OPTIONAL {
        ?association org:hasSite ?site .
      }
      ?primarySite organisatie:bestaatUit ?adres ;
                   mu:uuid ?Puuid .
      OPTIONAL {
        ?primarySite dcterms:description ?pDes .
      }
      OPTIONAL {
        ?primarySite ere:vestigingstype ?pSiteType .
      }
      OPTIONAL {
        ?pSiteType a code:TypeVestiging ;
                   mu:uuid ?pSiteTypeUuid ;
                   skos:prefLabel ?pSiteTypeName .
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
     `,
    undefined,
    endpoint
  )
}

module.exports = {
  batchedDbUpdate,
  moveToOrgGraph
}
