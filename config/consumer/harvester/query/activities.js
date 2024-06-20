const ACTIVITIES_QUERY = `INSERT {
  GRAPH <http://mu.semte.ch/graphs/public> {
          ?activity skos:topConceptOf <http://data.vlaanderen.be/id/conceptscheme/VerenigingActiviteitenCode/6c10d98a-9089-4fe8-ba81-3ed136db0265> ;
                skos:inScheme <http://data.vlaanderen.be/id/conceptscheme/VerenigingActiviteitenCode/6c10d98a-9089-4fe8-ba81-3ed136db0265> .
          <http://data.vlaanderen.be/id/conceptscheme/VerenigingActiviteitenCode/6c10d98a-9089-4fe8-ba81-3ed136db0265> skos:hasTopConcept ?activity .
  }
}
WHERE
  {
    GRAPH <http://mu.semte.ch/graphs/ingest> {
        ?association reorg:orgActivity ?activity .
    }
  }
`

module.exports = {
  ACTIVITIES_QUERY,
};