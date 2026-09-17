#!/bin/bash
# Dump the triplestore to nquads and reload it into a fresh database on the virtuoso image
# pinned in docker-compose.yml. Use it to move to a new virtuoso engine (7.2.5.1 -> 7.2.9)
# or to get a database off 32-bit prefix IDs. Run from the app root, as root.
# Stops every service except virtuoso and leaves them stopped; start them afterwards with
# `docker compose up -d` (or scripts/reset-elastic.sh when the search backend changed too).

set -euo pipefail
cd "$(dirname "$0")/.."

echo "warning: this stops all services except virtuoso and rebuilds data/db, you have 3 seconds to press ctrl+c"
sleep 3

if ! docker compose ps --services --status running | grep -qx virtuoso; then
  echo "virtuoso is not running. Start it with 'docker compose start virtuoso' (not 'up', that recreates it on the new image)." >&2
  echo "If it exits on 'The transaction log file has been produced by server version', pin the previous virtuoso image in docker-compose.yml, 'docker compose up -d virtuoso', then rerun this script." >&2
  exit 1
fi
if ls data/db/dumps/*.nq.gz data/db/toLoad/*.nq.gz >/dev/null 2>&1; then
  echo "data/db/dumps or data/db/toLoad already holds a dump; move it away first" >&2
  exit 1
fi

backup="data/db-backup-$(date +%Y%m%d-%H%M%S)"
trap 'echo "failed. Old db files: $backup if that dir exists, else still in data/db. Restart services with docker compose start, not up." >&2' ERR

echo "1/6 stopping everything except virtuoso"
others=$(docker compose ps --services --status running | grep -vx virtuoso || true)
if [ -n "$others" ]; then docker compose stop $others; fi

echo "2/6 dumping to nquads"
# the dump procedure ships in the image: at / on tenforce/virtuoso, under /docker-virtuoso on redpencil/virtuoso
docker compose exec -T virtuoso sh -c 'f=/dump_nquads_procedure.sql; [ -f $f ] || f=/docker-virtuoso/dump_nquads_procedure.sql; isql-v < $f' >/dev/null
docker compose exec -T virtuoso isql-v exec="dump_nquads ('dumps', 1, 1000000000, 1);" >/dev/null
docker compose exec -T virtuoso sh -c 'mkdir -p /data/toLoad && mv /data/dumps/*.nq.gz /data/toLoad/'
dumped=$(zcat data/db/toLoad/*.nq.gz | wc -l)
echo "    dumped $dumped quads"

echo "3/6 stopping virtuoso and moving the old db to $backup"
docker compose exec -T virtuoso isql-v exec="checkpoint;" >/dev/null   # flush to virtuoso.db, so the backup is complete
docker compose stop -t 120 virtuoso
mkdir -p "$backup"
for f in virtuoso.db virtuoso.trx virtuoso.pxa virtuoso-temp.db virtuoso.log .dba_pwd_set; do
  if [ -e "data/db/$f" ]; then mv "data/db/$f" "$backup/"; fi
done
rm -f data/db/.data_loaded data/db/virtuoso.lck

echo "4/6 starting the new virtuoso and loading the dump"
started=$(date -u +%Y-%m-%dT%H:%M:%SZ)
docker compose pull virtuoso
docker compose up -d virtuoso
until [ -f data/db/.data_loaded ]; do sleep 5; done
until docker compose logs --since "$started" virtuoso 2>/dev/null | grep -q "server online at 8890"; do sleep 2; done

echo "5/6 verifying"
if docker compose logs --since "$started" virtuoso | grep -q "32-bit prefix"; then
  echo "the new db still reports 32-bit prefix IDs; old db is in $backup" >&2
  exit 1
fi
loaded=$(docker compose exec -T virtuoso isql-v exec="sparql select (count(*) as ?c) where { graph ?g { ?s ?p ?o } filter(?g != <http://www.openlinksw.com/schemas/virtrdf#>) };" | grep -oE '^[0-9]+' | head -1)
echo "    loaded $loaded quads (dumped $dumped; the surplus sits in virtuoso's own graphs)"
if [ "$loaded" -lt "$dumped" ]; then
  echo "fewer quads loaded than dumped; do not start the stack. Old db is in $backup" >&2
  exit 1
fi

echo "6/6 done. Start the rest with 'docker compose up -d' (or scripts/reset-elastic.sh)."
echo "    Once happy, remove $backup and data/db/toLoad/*.nq.gz"
