(define-resource concept ()
  :class (s-prefix "skos:Concept")
  :properties `((:pref-label :string ,(s-prefix "skos:prefLabel"))
                (:notation :string ,(s-prefix "skos:notation"))
                (:modified :datetime ,(s-prefix "dct:modified")))
  :has-many `((concept-scheme :via ,(s-prefix "skos:inScheme")
                              :as "concept-scheme")
              (concept :via ,(s-prefix "skos:broader")
                       :as "broader")
              (concept-scheme :via ,(s-prefix "skos:hasTopConcept")
                              :as "top-concept-of"
                              :inverse t))
  :on-path "concepts"
  :resource-base (s-url "http://awesome-poc.com/concepts/"))

(define-resource concept-scheme ()
  :class (s-prefix "skos:ConceptScheme")
  :properties `((:pref-label :string ,(s-prefix "skos:prefLabel"))
                (:definition :string ,(s-prefix "skos:definition")))
  :has-many `((concept-scheme :via ,(s-prefix "skos:inScheme")
                              :as "in-scheme"
                              :inverse t)
              (concept :via ,(s-prefix "skos:hasTopConcept")
                       :as "top-concept"))
  :on-path "concept-schemes"
  :resource-base (s-url "http://awesome-poc.com/concept-schemes/"))

