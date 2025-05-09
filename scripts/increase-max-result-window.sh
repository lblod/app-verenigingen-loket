#!/bin/bash

# Get container ID for the 'elasticsearch' service
CONTAINER_ID=$(docker compose ps -q elasticsearch)

if [ -z "$CONTAINER_ID" ]; then
  echo "Elasticsearch container not found. Is it running?"
  exit 1
fi

MAX_RESULT_WINDOW=50000

# Get list of all indices
INDICES=$(docker exec "$CONTAINER_ID" curl -s http://localhost:9200/_cat/indices?h=index)

if [ -z "$INDICES" ]; then
  echo "No indices found or Elasticsearch is not reachable."
  exit 1
fi

# Update max_result_window for each index (skip system indices)
echo "Updating max_result_window for all user indices to $MAX_RESULT_WINDOW..."
for index in $INDICES; do
  if [[ "$index" == .* ]]; then
    echo "Skipping system index: $index"
    continue
  fi

  echo "Updating $index..."
  docker exec "$CONTAINER_ID" curl -s -X PUT "http://localhost:9200/$index/_settings" \
    -H 'Content-Type: application/json' \
    -d "{
      \"index\" : {
        \"max_result_window\" : $MAX_RESULT_WINDOW
      }
    }"
  echo
done

echo "Done."
