(in-package :mu-cl-resources)

(setf *include-count-in-paginated-responses* t)
(setf *supply-cache-headers-p* t)
(setf sparql:*experimental-no-application-graph-for-sudo-select-queries* t)

;; TODO: fix this once the virtuoso bug is fixed
;; Virtuoso bug: https://github.com/openlink/virtuoso-opensource/issues/1361
;; High level description: a complex interplay between delta-consumer, mu-auth and virtuoso
;;  results in string sometimes not being deleted.
;;  We ingest data now skipping mu-auth, as a result the cache-service is not flushed.
;;  Hence the extra wiring in 'links' directive, to go to resource directly.
+(setf *cache-model-properties-p* nil)
+(defparameter *cache-count-queries* nil)


(read-domain-file "concept.lisp")
(read-domain-file "users.lisp")
(read-domain-file "associations.lisp")
(read-domain-file "extra.lisp")
(read-domain-file "file.lisp")
(read-domain-file "concept.lisp")
(read-domain-file "countries.lisp")
