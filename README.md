# Verenigingen loket

## What's included?

This repository harvest two setups. The base of these setups resides in the standard docker-compose.yml.

- _docker-compose.yml_ This provides you with the backend components. There is a frontend application included which you can publish using a separate proxy (we tend to put a letsencrypt proxy in front).
- _docker-compose.dev.yml_ Provides changes for a good frontend development setup.
  - publishes the virtuoso instance on port 8890 so you can easily see what content is stored in the base triplestore
  - provides a mock-login backend service so you don't need the ACM/IDM integration.

## Running and maintaining

General information on running and maintaining an installation

### Running your setup

#### system requirments

You'll need a beefy machine, with at least 16 GB of ram.

#### Running the dev setup

First install `git-lfs` (see <https://github.com/git-lfs/git-lfs/wiki/Installation>)

```
 # Ensure git-lfs is enabled after installation
  git lfs install

  # Clone this repository
  git clone https://github.com/lblod/app-verenigingen-loket.git

  # Move into the directory
  cd app-verenigingen-loket
```

To ease all typing for `docker-compose` commands, start by creating the following files in the directory of the project.
A `docker-compose.override.yml` file with following content:

```
version: '3.7'
```

And an `.env` file with following content:

```
COMPOSE_FILE=docker-compose.yml:docker-compose.dev.yml:docker-compose.override.yml
```

##### If you start for the first time
```
drc down
rm -rf data
drc up -d migrations # wait for successs
```
On production only update `docker-compose.override.yml` to:
```
  virtuoso:
    volumes:
      - ./config/virtuoso/virtuoso-production.ini:/data/virtuoso.ini
```
(Consider doing the same on QA if it helps)

Then start ingesting `OP` master data.

Update `docker-compose.override.yml` to:

```
  op-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://organisaties.abb.vlaanderen.be" # choose the correct endpoint
      DCR_LANDING_ZONE_DATABASE: "virtuoso" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "virtuoso" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
Then:
```
drc up -d database op-consumer
# Wait until success of the previous step
drc up -d update-bestuurseenheid-mock-login
# Wait until it boots, before running the next command. You can also wait the cron-job kicks in.
drc exec update-bestuurseenheid-mock-login curl -X POST http://localhost/heal-mock-logins
# Takes about 20 min with prod data
```
Then, update `docker-compose.override.yml` to:
```
  op-consumer:
    environment:
      DCR_SYNC_BASE_URL: "https://organisaties.abb.vlaanderen.be" # choose the correct endpoint
      DCR_LANDING_ZONE_DATABASE: "database"
      DCR_REMAPPING_DATABASE: "database"
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
```
```
drc up -d op-consumer
```
Then update the `verenigen-harvester` master data

Update `docker-compose.override.yml` to:
```
  harvester-consumer:
    environment:
      DCR_LANDING_ZONE_DATABASE: "virtuoso" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "virtuoso" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
      BATCH_SIZE: 2000
      SLEEP_BETWEEN_BATCHES: 1
      DCR_SYNC_BASE_URL: "https://harvester.verenigingen.lokaalbestuur.vlaanderen.be"
      DCR_SYNC_LOGIN_ENDPOINT: "https://harvester.verenigingen.lokaalbestuur.vlaanderen.be/sync/verenigingen/login"
      DCR_SECRET_KEY: "THE KEY"
```

```
drc up -d database harvester-consumer # wait until this message: delta-sync-queue: Remaining number of tasks 0
```
Update `docker-compose.override.yml` to:
```
  harvester-consumer:
    environment:
      DCR_LANDING_ZONE_DATABASE: "database" # Restore to database
      DCR_REMAPPING_DATABASE: "database" # Restore to database
      DCR_DISABLE_DELTA_INGEST: "false"
      DCR_DISABLE_INITIAL_SYNC: "false"
      BATCH_SIZE: 2000
      SLEEP_BETWEEN_BATCHES: 1
      DCR_SYNC_BASE_URL: "https://harvester.verenigingen.lokaalbestuur.vlaanderen.be"
      DCR_SYNC_LOGIN_ENDPOINT: "https://harvester.verenigingen.lokaalbestuur.vlaanderen.be/sync/verenigingen/login"
      DCR_SECRET_KEY: "THE KEY"
```

```
drc up -d
```
Then kick the `mu-search` to do its thing:
```
/bin/bash ./scripts/reset-elastic.sh
```

##### Normal start

This should be your go-to way of starting the stack.

```
docker-compose up # or 'docker-compose up -d' if you want to run it in the background
```

Always double check the status of the migrations `docker-compose logs -f --tail=100 migrations`
Wait for everything to boot to ensure clean caches.

Probably the first thing you'll want to do, is see wether the app is running correctly. The fastest way forward is creating a `docker-compose.override.yml` file next to the other `docker-compose.yml` files, and add

```
# (...)
  loket:
    ports:
      - 4205:80
```

This way, you can directly connect to a built version of the frontend on port `4205`. Note, you might have conflicts because the port is already busy.
you're free to change `4205` to whatever suits you.

Once the migrations have ran, you can start developing your application by connecting the ember frontend application to this backend. See <https://github.com/lblod/frontend-verenigingen-loket> for more information on development with the ember application.

#### Running the regular setup

```
docker-compose up
```

The stack is built starting from [mu-project](https://github.com/mu-semtech/mu-project).

OpenAPI documentation can be generated using [cl-resources-openapi-generator](https://github.com/mu-semtech/cl-resources-openapi-generator).

### Ingesting external data

### Setting up the delta-producers related services

To make sure the app can share data, producers need to be set up. There is an intial sync, that is potentially very expensive, and must be started manually

##### Deltas producer: extra considerations

###### Separate publication-triplestore

Due to performance issues, related to the high usage, a separate triplestore (virtuoso) has been introduced to offload the publication of the data.
This architectural change is currently under evaluation. The criteria for evaluation will be: the performance win vs the practical consequences of such change.

If deemed succesful, we might consider moving the remaining publication graphs to this triplestore too (mandatarissen and leidinggevenden).

As a consequence, producers using the separate triplestore, will also publish and host the json-diff files.
Mainly to simplify the transition to a separate publication triple store (else we would need a separate mu-auth and deltanotifier).
In essence, it takes over https://github.com/lblod/delta-producer-json-diff-file-publisher, although both can still be combined.

###### Sharing of attachments and other file data.

If files need to be shared over deltas (attachments, form-data, cached-files) you will need to set in a docker-compose.override.yml

```
#(...)
  delta-producer-publication-graph-maintainer-submissions:
    KEY: "foo-bar
```

This will needs to be set in the consuming stack too. See [delta-producer-publication-graph-maintainer](https://github.com/lblod/delta-producer-publication-graph-maintainer) for more informmation on the implications.

### Upgrading your setup

Once installed, you may desire to upgrade your current setup to follow development of the main stack. The following example describes how to do this easily for both the demo setup, as well as for the dev setup.

#### Upgrading the dev setup

For the dev setup, we assume you'll pull more often and thus will most likely clear the database separately:

```
# This assumes the .env file has been set. Cf. supra in the README.md
# Bring the application down
docker-compose down
# Pull in the changes
git pull origin master
# Launch the stack
docker-compose up
```

As with the initial setup, we wait for everything to boot to ensure clean caches. You may choose to monitor the migrations service in a separate terminal to and wait for the overview of all migrations to appear: `docker-compose logs -f --tail=100 migrations`.

Once the migrations have ran, you can go on with your current setup.

### Cleaning the database

At some times you may want to clean the database and make sure it's in a pristine state.

```
# This assumes the .env file has been set. Cf. supra in the README.md
# Bring down our current setup
docker-compose down
# Keep only required database files
rm -Rf data/db
git checkout data/db
# Bring the stack back up
docker-compose up
```

Notes:

- virtuoso can take a while to execute its first run, meanwhile the database is inaccessible. Make also sure to wait for the migrations to run.
- data from external sources need to be synced again.
