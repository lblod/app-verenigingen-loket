#!/bin/bash

set -e
echo "warning this will run queries on the triplestore and delete containers, you have 3 seconds to press ctrl+c"
sleep 3
docker compose rm -fs elasticsearch search
sudo rm -rf data/elasticsearch/
docker compose up -d virtuoso
docker compose exec -T virtuoso isql-v <<EOF
SPARQL DELETE WHERE {   GRAPH <http://mu.semte.ch/authorization> {     ?s ?p ?o.   } };
exec('checkpoint');
exit;
EOF
docker compose up -d --remove-orphans
