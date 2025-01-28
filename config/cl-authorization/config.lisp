;;;;;;;;;;;;;;;;;;;
;;; delta messenger
(in-package :delta-messenger)

;; (push (make-instance 'delta-logging-handler) *delta-handlers*)
(add-delta-messenger "http://delta-notifier/")


;;;;;;;;;;;;;;;;;
;;; configuration
(in-package :client)
(setf *log-sparql-query-roundtrip* nil)
(setf *backend* "http://virtuoso:8890/sparql")

(in-package :server)
(setf *log-incoming-requests-p* nil)

;;;;;;;;;;;;;;;;;
;;; access rights

(type-cache::add-type-for-prefix "http://mu.semte.ch/sessions/" "http://mu.semte.ch/vocabularies/session/Session")

(in-package :acl)

(defparameter *access-specifications* nil
  "All known ACCESS specifications.")

(defparameter *graphs* nil
  "All known GRAPH-SPECIFICATION instances.")

(defparameter *rights* nil
  "All known GRANT instances connecting ACCESS-SPECIFICATION to GRAPH.")


;;;;;;;;;;;
;; prefixes

(define-prefixes
  ;; Core
  :mu "http://mu.semte.ch/vocabularies/core/"
  :session "http://mu.semte.ch/vocabularies/session/"
  ;; Application
  :adms "http://www.w3.org/ns/adms#"
  :adres "https://data.vlaanderen.be/ns/adres#"
  :besluit "http://data.vlaanderen.be/ns/besluit#"
  :core "http://www.w3.org/2004/02/skos/core#"
  :feitelijkeverenigingen "https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#"
  :foaf "http://xmlns.com/foaf/0.1/"
  :m8g "http://data.europa.eu/m8g/"
  :org "http://www.w3.org/ns/org#"
  :organisatie "http://lblod.data.gift/vocabularies/organisatie/"
  :nfo "http://www.semanticdesktop.org/ontologies/2007/03/22/nfo#")

;;;;;;;;;;;;;;;;;
;; access queries


(defun query-for-access-by-role (role)
  "Generates the query to verify access by ROLE."
  (format nil
          "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
                  PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
                  SELECT distinct ?session_group ?session_role WHERE {
                    <SESSION_ID> ext:sessionGroup/mu:uuid ?session_group;
                      ext:sessionRole ?session_role.
                    FILTER( ?session_role = \"~A\" )
                  }"
          role))

;;;;;;;;;;;;;;;
;; known graphs

(define-graph public ("http://mu.semte.ch/graphs/public")
  ("foaf:OnlineAccount" -> _)
  ("foaf:Person" -> _)
  ("besluit:Bestuurseenheid" -> _)
  ("org:Organization" -> _)
  ("organisatie:TypeVestiging" -> _)
  ("organisatie:BestuurseenheidClassificatieCode" -> _)
  ("organisatie:OrganisatieStatusCode" -> _)
  ("core:Concept" -> _)
  ("core:ConceptScheme" -> _))

(define-graph verenigingen ("http://mu.semte.ch/graphs/organizations")
  ;; This is scoped by session_group and role when suppling access rights
  ;; TODO: should this be scoped only on session_group?
  ("nfo:FileDataObject" -> _)
  ("adres:Postinfo" -> _)
  ("feitelijkeverenigingen:Erkenning" -> _)
  ("m8g:PeriodOfTime" -> _)
  ("feitelijkeverenigingen:FeitelijkeVereniging" -> _)
  ("besluit:Bestuurseenheid" -> _)
  ("org:Organization" -> _)
  ("core:Concept" -> _)
  ("core:ConceptScheme" -> _))


(define-graph organization ("http://mu.semte.ch/graphs/organizations/")
  ("nfo:FileDataObject" -> _) ;;TODO: why file data object?
  ("foaf:Person" -> _)
  ("foaf:OnlineAccount" -> _)
  ("adms:Identifier" -> _))

;;;;;;;;;;;;;;;;;
;; allowed groups

(supply-allowed-group "public")

(supply-allowed-group "org"
  :query "PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
         PREFIX mu: <http://mu.semte.ch/vocabularies/core/>
         SELECT ?bestuurseenheid WHERE {
           <SESSION_ID> ext:sessionGroup/mu:uuid ?bestuurseenheid.
         }"
  :parameters ("bestuurseenheid"))

(supply-allowed-group "verenigingen-beheerder"
  :query (query-for-access-by-role "LoketLB-verenigingenGebruiker")
  ;; TODO: does this need session_role?
  :parameters ())

(supply-allowed-group "verenigingen-lezer"
  :query (query-for-access-by-role "LoketLB-verenigingenLezer")
  ;; TODO: does this need session_role?
  :parameters ())

;;;;;;;;;;;;;;;;
;; access grants

(grant (read)
       :to-graph public
       :for-allowed-group "public")

(grant (read)
       :to organization
       :for "org")

(grant (read write)
       :to verenigingen
       :for "verenigingen-beheerder")

(grant (read )
       ;; TODO: if session_role is removed from the allowed_group, write should be removed here
       :to verenigingen
       :for "verenigingen-lezer")
