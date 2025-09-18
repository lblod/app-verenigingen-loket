(define-resource country ()
  :class (s-prefix "euvoc:Country")
  :properties `((:name :string ,(s-prefix "skos:prefLabel")))
  :resource-base (s-url "http://publications.europa.eu/resource/authority/country/")
  :on-path "countries")

