(in-package :mu-cl-resources)

(setf *include-count-in-paginated-responses* t)
(setf *supply-cache-headers-p* t)
(setf sparql:*experimental-no-application-graph-for-sudo-select-queries* t)
(setf *cache-model-properties-p* t)

(read-domain-file "concept.lisp")
(read-domain-file "users.lisp")
(read-domain-file "associations.lisp")
(read-domain-file "extra.lisp")
(read-domain-file "file.lisp")
(read-domain-file "concept.lisp")
(read-domain-file "countries.lisp")
