#!/bin/bash


ELASTICSEARCH_ENDPOINT="localhost:9200"
CLUSTER_SETTINGS='{
  "persistent": {
    "cluster.max_shards_per_node": "3000"
  }
}'

CONTAINER_NAME=$(docker ps --filter "name=elasticsearch" --format "{{.Names}}" | head -n 1)

if [ -z "$CONTAINER_NAME" ]; then
  echo "No Elasticsearch container found"
  exit 1
fi

docker exec -ti $CONTAINER_NAME bash -c "curl -X PUT $ELASTICSEARCH_ENDPOINT/_cluster/settings -H 'Content-Type: application/json' -d '$CLUSTER_SETTINGS'"

echo "Elasticsearch cluster settings updated successfully"
