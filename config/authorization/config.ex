alias Acl.Accessibility.Always, as: AlwaysAccessible
alias Acl.Accessibility.ByQuery, as: AccessByQuery
alias Acl.GraphSpec.Constraint.ResourceFormat, as: ResourceFormatConstraint
alias Acl.GraphSpec.Constraint.Resource, as: ResourceConstraint
alias Acl.GraphSpec, as: GraphSpec
alias Acl.GroupSpec, as: GroupSpec
alias Acl.GroupSpec.GraphCleanup, as: GraphCleanup
alias Acl.GraphSpec.Constraint.Resource.NoPredicates, as: NoPredicates
alias Acl.GraphSpec.Constraint.Resource.AllPredicates, as: AllPredicates

defmodule Acl.UserGroups.Config do

defp access_by_role( group_string ) do
    %AccessByQuery{
      vars: ["session_group","session_role"],
      query: sparql_query_for_access_role( group_string ) }
  end

  defp access_by_role_for_single_graph( group_string ) do
    %AccessByQuery{
      vars: [],
      query: sparql_query_for_access_role( group_string ) }
  end

  defp sparql_query_for_access_role( group_string ) do
    "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
    PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
    SELECT DISTINCT ?session_group ?session_role WHERE {
      <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                   ext:sessionRole ?session_role.
      FILTER( ?session_role = \"#{group_string}\" )
    }"
  end

  defp can_access_automatic_submission() do
    %AccessByQuery{
      vars: [],
      query: "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
        PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
        SELECT DISTINCT ?session_group ?session_role WHERE {
          <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                       ext:sessionRole ?session_role.
          FILTER( ?session_role = \"LoketLB-vendorManagementGebruiker\" )
        }"
      }
  end

  defp is_authenticated() do
    %AccessByQuery{
      # Let's be restrictive,
      # we want the session to be attached to a role and uuid of bestuurseeneheid ( == ?session_group )
      vars: [],
      query: "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
        PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
        SELECT DISTINCT ?session_group ?session_role WHERE {
          <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                       ext:sessionRole ?session_role.
        }"
      }
  end

  defp access_sensitive_delta_producer_data() do
    %AccessByQuery{
      vars: [ "group_name" ],
      query: "
        PREFIX foaf: <http://xmlns.com/foaf/0.1/>
        PREFIX muAccount: <http://mu.semte.ch/vocabularies/account/>
        SELECT DISTINCT ?group_name WHERE {
          <SESSION_ID> muAccount:account ?onlineAccount.

          ?onlineAccount  a foaf:OnlineAccount.

          ?agent a foaf:Agent;
            foaf:account ?onlineAccount.

          ?group foaf:member ?agent;
            foaf:name ?group_name.
        }"
      }
  end

  defp access_for_vendor_api() do
    %AccessByQuery{
      vars: ["vendor_id", "session_group"],
      query: sparql_query_for_access_vendor_api()
    }
  end

  defp sparql_query_for_access_vendor_api() do
    " PREFIX muAccount: <http://mu.semte.ch/vocabularies/account/>
      PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
      SELECT DISTINCT ?vendor_id ?session_group WHERE {
        <SESSION_ID> muAccount:canActOnBehalfOf/mu:uuid ?session_group;
                     muAccount:account/mu:uuid ?vendor_id.
      } "
  end



  def user_groups do
    # These elements are walked from top to bottom.  Each of them may
    # alter the quads to which the current query applies.  Quads are
    # represented in three sections: current_source_quads,
    # removed_source_quads, new_quads.  The quads may be calculated in
    # many ways.  The useage of a GroupSpec and GraphCleanup are
    # common.
    [
      # // PUBLIC
      %GroupSpec{
        name: "public",
        useage: [:read,:read_for_write],
        access: %AlwaysAccessible{}, # TODO: Should be only for logged in users
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/public",
                    constraint: %ResourceConstraint{
                      resource_types: [
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
                    } },
                  %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/sessions",
                    constraint: %ResourceFormatConstraint{
                      resource_prefix: "http://mu.semte.ch/sessions/"
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

      # // ORG-MANDATENBEHEER
      %GroupSpec{
        name: "o-mdb-r",
        useage: [:read],
        access: access_by_role( "LoketVerenigingen-Gebruiker" ),
        graphs: [ %GraphSpec{
                    graph: "http://mu.semte.ch/graphs/organizations/",
                    constraint: %ResourceConstraint{
                      resource_types: [
                        "https://data.vlaanderen.be/ns/adres#Postinfo"
                         ] } } ] },
                        

      %GraphCleanup{
        originating_graph: "http://mu.semte.ch/application",
        useage: [:write],
        name: "clean"
      }
    ]
  end
end