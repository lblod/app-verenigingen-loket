alias Acl.Accessibility.Always, as: AlwaysAccessible
alias Acl.GraphSpec.Constraint.Resource, as: ResourceConstraint
alias Acl.GraphSpec.Constraint.ResourceFormat, as: ResourceFormatConstraint
alias Acl.Accessibility.ByQuery, as: AccessByQuery
alias Acl.GraphSpec, as: GraphSpec
alias Acl.GroupSpec, as: GroupSpec
alias Acl.GroupSpec.GraphCleanup, as: GraphCleanup

defmodule Acl.UserGroups.Config do
  @protected_resource_type [
    "https://data.vlaanderen.be/ns/adres#Postinfo",
    "https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#Erkenning",
    "http://data.europa.eu/m8g/PeriodOfTime",
    "https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#FeitelijkeVereniging",
    "http://data.vlaanderen.be/ns/besluit#Bestuurseenheid",
    "http://www.w3.org/ns/org#Organization"
  ]

  @public_type [
    "http://xmlns.com/foaf/0.1/OnlineAccount",
    "http://xmlns.com/foaf/0.1/Person",
    "http://data.vlaanderen.be/ns/besluit#Bestuurseenheid",
    "http://www.w3.org/ns/org#Organization",
    "http://lblod.data.gift/vocabularies/organisatie/TypeVestiging",
    "http://lblod.data.gift/vocabularies/organisatie/BestuurseenheidClassificatieCode",
    "http://lblod.data.gift/vocabularies/organisatie/OrganisatieStatusCode",
    "http://www.w3.org/2004/02/skos/core#Concept",
    "http://www.w3.org/2004/02/skos/core#ConceptScheme"
]

  defp access_by_role( group_string ) do
    %AccessByQuery{
      vars: ["session_group","session_role"],
      query: sparql_query_for_access_role( group_string ) }
  end

  defp sparql_query_for_access_role( group_string ) do
    "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    SELECT distinct ?session_group ?session_role WHERE {
      <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
        ext:sessionRole ?session_role.
      FILTER( ?session_role = \"#{group_string}\" )
    }"
  end

  def user_groups do
    [
      # // PUBLIC
      %GroupSpec{
        name: "public",
        useage: [:read],
        access: %AlwaysAccessible{}, # Needed for mock-login
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/public",
                    constraint: %ResourceConstraint{
                      resource_types: @public_type
                    } } ] },
      %GroupSpec{
        name: "org",
        useage: [:read],
        access: %AccessByQuery{
          vars: ["session_group"],
          query: "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
                  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
                  SELECT ?session_group ?session_role WHERE {
                    <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group.
                    }" },
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/organizations/",
                    constraint: %ResourceConstraint{
                      resource_types: [
                        "http://xmlns.com/foaf/0.1/Person",
                        "http://xmlns.com/foaf/0.1/OnlineAccount",
                        "http://www.w3.org/ns/adms#Identifier",
                      ] } } ] },
      # // Logged in users
      %GroupSpec{
        name: "verenigen-loket-beheerder",
        useage: [:read, :write, :read_for_write],
        # **Explanations on the chosen role**
        # - We reuse scopes firstly defined in Loket to handle worship data. Hence the LoketLB- prefix
        access: access_by_role( "LoketVerenigingen-Gebruiker" ),
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/organizations/",
                    constraint: %ResourceConstraint{
                      resource_types: @protected_resource_type
                    } } ] },
      # // CLEANUP
      #
      %GraphCleanup{
        originating_graph: "http://mu.semte.ch/application",
        useage: [:read, :write],
        name: "clean"
      }
    ]
  end
end
