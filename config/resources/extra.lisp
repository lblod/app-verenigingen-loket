(define-resource address ()
  :class (s-prefix "locn:Address")
  :properties `((:number :string ,(s-prefix "adres:Adresvoorstelling.huisnummer"))
                (:box-number :string ,(s-prefix "adres:Adresvoorstelling.busnummer"))
                (:street :string ,(s-prefix "locn:thoroughfare"))
                (:postcode :string ,(s-prefix "locn:postCode"))
                (:municipality :string ,(s-prefix "adres:gemeentenaam"))
                (:province :string ,(s-prefix "locn:adminUnitL2"))
                (:country :string ,(s-prefix "adres:land"))
                (:full-address :string ,(s-prefix "locn:fullAddress"))
                (:address-register-uri :url ,(s-prefix "adres:verwijstNaar")))
  :has-one `((concept :via ,(s-prefix "dct:source")
                     :as "source"))
  :resource-base (s-url "http://data.lblod.info/id/adressen/")
  :on-path "addresses")

(define-resource identifier ()
  :class (s-prefix "adms:Identifier")
  :properties `((:id-name :string ,(s-prefix "skos:notation")))
  :has-one `((structured-identifier :via ,(s-prefix "generiek:gestructureerdeIdentificator")
                                    :as "structured-identifier"))
  :on-path "identifiers"
  :resource-base "http://data.lblod.info/id/identificatoren/")

(define-resource structured-identifier ()
  :class (s-prefix "generiek:GestructureerdeIdentificator")
  :properties `((:local-id :string ,(s-prefix "generiek:lokaleIdentificator")))
  :on-path "structured-identifiers"
  :resource-base "http://data.lblod.info/id/gestructureerdeIdentificatoren/")

(define-resource administrative-unit-classification-code ()
  :class (s-prefix "bestuurcode:BestuurseenheidClassificatieCode")
  :properties `((:label :string ,(s-prefix "skos:prefLabel")))
  :on-path "administrative-unit-classification-codes"
  :resource-base "http://data.vlaanderen.be/id/concept/BestuurseenheidClassificatieCode/")

(define-resource organization-status-code ()
  :class (s-prefix "code:OrganisatieStatusCode")
  :properties `((:label :string ,(s-prefix "skos:prefLabel")))
  :features '(include-uri)
  :on-path "organization-status-codes"
  :resource-base "http://lblod.data.gift/concepts/")

(define-resource postalCode ()
  :class (s-prefix "adres:Postinfo")
  :properties `((:postal-code :string ,(s-prefix "adres:postcode"))
                (:postal-name :string ,(s-prefix "adres:postnaam")))
  :on-path "postal-codes"
  :resource-base "http://lblod.data.gift/concepts/")

(define-resource activity ()
  :class (s-prefix "skos:Concept")
  :properties `((:pref-label :string ,(s-prefix "skos:prefLabel"))
                (:notation :string ,(s-prefix "skos:notation")))
  :on-path "activities"
  :resource-base "http://data.lblod.info/id/identificatoren/")

(define-resource change ()
  :class (s-prefix "orga:Veranderingsgebeurtenis")
  :properties `((:label :string ,(s-prefix "skos:prefLabel")))
  :on-path "changes"
  :resource-base "http://data.lblod.info/id/identificatoren/")

(define-resource change-event ()
  :class (s-prefix "org:ChangeEvent")
  :properties `((:date :date ,(s-prefix "dct:date")))
  :has-one `((change :via ,(s-prefix "ch:typeWijziging")
                     :as "type")
             (change :via ,(s-prefix "locn:veranderingsgebeurtenisResultaat")
                     :as "result")
             (organization :via ,(s-prefix "org:resultingOrganization")
                           :as "association"))
  :on-path "change-events"
  :resource-base "http://data.lblod.info/id/identificatoren/")

