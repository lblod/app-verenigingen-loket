# Changelog

## Unreleased

- Link recognitions to public organization [CLBV-1010] & [CLBV-972]
- Restructure and strengthen dispatcher rules [DL-6515]
- fix a pagination issue [CLBV-1024]
- Add verenigingsregister api proxy service [CLBV-1050]
- Expose internal ids [CLBV-1054]
- Re-write mu-cl-resources config into Lisp
- Expose ETag of associations [CLBV-1046]
- Allow displaying associations in the overview beyond 10k
  - See also [CLBV-1021]
- Improvements for mutatiedienst

### Deploy notes

Add verenigingsregister client config to dock-compose.override.yml.
cf [README](https://github.com/lblod/verenigingsregister-proxy-service)

For DEV:

```
  verenigingsregister-api-proxy:
    environment:
      ENVIRONMENT: 'DEV'
      AUD: 'https://authenticatie-ti.vlaanderen.be/op'
      API_URL: 'https://iv.api.tni-vlaanderen.be/api/v1/organisaties/verenigingen/'
      AUTHORIZATION_KEY: 'your-key'
      AUTH_DOMAIN: 'authenticatie-ti.vlaanderen.be'
      CLIENT_ID: 'your-client-id'
```

or PRD:

Add Magda private authentication key (`.pem`) to `/config/verenigingsregister-proxy-service/`

```
  verenigingsregister-api-proxy:
    environment:
      ENVIRONMENT: 'PROD'
      AUD: 'https://authenticatie.vlaanderen.be/op'
      CLIENT_ID: 'your-client-id'
      SCOPE: 'dv_magda_organisaties_verenigingen_verenigingen_v1_G dv_magda_organisaties_verenigingen_verenigingen_v1_A dv_magda_organisaties_verenigingen_verenigingen_v1_P dv_magda_organisaties_verenigingen_verenigingen_v1_D'
```

Restart services for new configs:

```
drc stop
# Only needed to update the settings for existing indexes. Newly created indexes will have the new settings by default.
bash scripts/increase-max-result-window.sh
drc up -d
```

## 1.5.2 (2025-04-18)

- bump frontend [v1.4.3]

## 1.5.1 (2025-04-17)

- bump frontend [v1.4.2](https://github.com/lblod/frontend-verenigingen-loket/blob/master/CHANGELOG.md#v140-2025-04-17)

### Deploy Notes

```

drc up -d frontend

```

## 1.5.0 (2025-04-17)

- Fix bug related to duplicate values of some strings.
  The consumer on initial sync wasn't properly handling multi-line strings.
  See [PR:delta-consumer](https://github.com/lblod/delta-consumer/pull/36)
  Bug reported [CLBV-1004]. Implies full flush.
- Update of the data type: https://data.vlaanderen.be/ns/FeitelijkeVerenigingen#Vereniging
  - See also [CLBV-891] and https://github.com/lblod/app-verenigingen-loket/pull/17
- Add status for associations with migration and mu-search config changes
- bump frontend [v1.4.0](https://github.com/lblod/frontend-verenigingen-loket/blob/master/CHANGELOG.md#v140-2025-04-17)
- bump verenigingsloket-download-service [v2.1.0](https://github.com/lblod/verenigingsloket-download-service/releases/tag/v2.1.0)

### Deploy

### Deploy Notes

Ensure backup first!

```

drc down

```

Ensure `docker-compose.override.yml` contains:

```

  harvester-consumer:
    environment:
      DCR_LANDING_ZONE_DATABASE: "virtuoso" # for the initial sync, we go directly to virtuoso
      DCR_REMAPPING_DATABASE: "virtuoso" # for the initial sync, we go directly to virtuoso
      DCR_DISABLE_DELTA_INGEST: "true"
      DCR_DISABLE_INITIAL_SYNC: "true"

```

```

drc up -d migrations
drc up -d database harvester-consumer
drc up -d

```

Wait for the consumer to finish.
If that looks okay; reset elastic.

```

/bin/bash ./scripts/reset-elastic.sh

```

Experienced readers might have noticed that we don't revert the consumer back to ingesting in the `database` to trigger constant updates of `mu-search` and other caches. There is a good reason for that: currently, we are facing a bug in both `mu-auth` and `sparql-parser` that occurs with strings exceeding the ASCII range.

So, we'll have to temporarily revert to ingesting directly in Virtuoso and use a cron job running in the background. After everything is set up correctly, add a cron job on the server using `crontab -e`. Don't forget to update the paths depending on the environment you are in. Also respect the quircks of the cronfile.

```

00 4 \* \* \* cd /data/app-verenigingen-loket; ./scripts/reset-elastic.sh > /data/app-verenigingen-loket/reset-elastic.log 2>&1

```

That should be it.

# 1.4.0 (2025-03-07)

- Add missing key to `harvester-consumer`. [DL-6490]
- Reorganize delta consumers config to harmonize with the ecosystem

### Deploy Notes

```

drc up -d harvester-consumer op-consumer

```

# 1.3.4 (2025-03-07)

- CLBV-973: Filters 'Selecteer hoofdactiviteit(en)' and 'Selecteer type(s)' didn't show data
- CLBV-976: Filter 'Erkend door' didn't show data

## 1.3.3 (2025-02-26)

- CLBV-970: Fix an issue with file downloads in Chrome

## 1.3.2 (2025-02-17)

### General

- https://github.com/lblod/app-verenigingen-loket/pull/32

## 1.3.1 (2025-02-13)

## Frontend

- CLBV-965: Fix an issue with file downloads in Firefox

## 1.3.0 (2025-02-12)

### general

Lots of fixes:

- CLBV-797: postcode filter
- CLBV-957: change the way data is loaded for activities
- CLBV-951: change governing body on save erkenning
- CLBV-954: Download spreadsheet functionality
- CLBV-958: Improved fuzzy search
- CLBV-959: fix herstel filter

### frontend

- update excel download
- [v1.2.10](https://github.com/lblod/frontend-verenigingen-loket/blob/d3337b4a3aaf414517115b1e3508a34e51e8f240/CHANGELOG.md#v1210-2025-02-10)
- [v1.2.9](https://github.com/lblod/frontend-verenigingen-loket/blob/a5d9cadb85f647f533153f9a57f1ae5f906a0a6e/CHANGELOG.md#v129-2025-02-06)
- [v1.2.8](https://github.com/lblod/frontend-verenigingen-loket/blob/082687017de29713bb58ae9f73c5d964c11a61c1/CHANGELOG.md#v128-2025-02-06)

### Deploy instructions

```

drc down;
drc up -d

```

## 1.2.1 (2025-01-28)

- multiple updates/clean ups

### Deploy instructions

#### production

```

drc down;
drc up -d --remove-orphans

```

#### development/local

```

git fetch origin
git reset --hard origin/development

```

## 1.2.0 (2025-01-28)

### Changes

- Lots of mini bugfixes.
- Ensure now only one graph, making accessible all verenigingen for all bestuurseenheden.

### Deploy instructions

```

drc down
rm -rf data
drc up -d migrations # wait for successs

```

On production only update `docker-compose.override.yml` to:

```

virtuoso:
volumes: - ./config/virtuoso/virtuoso-production.ini:/data/virtuoso.ini

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

## 1.1.2 (2024-10-24)

- [#19](https://github.com/lblod/app-verenigingen-loket/pull/19) [CLBV-930] Fix zwijndrecht's name ([@wolfderechter](https://github.com/wolfderechter))
- [#16](https://github.com/lblod/app-verenigingen-loket/pull/16) [CLBV-914] Updated postalcodes ([@wolfderechter](https://github.com/wolfderechter))
- frontend [v1.2.1](https://github.com/lblod/frontend-verenigingen-loket/blob/master/CHANGELOG.md#v121-2024-10-07)

## 1.1.1 (2024-08-12)

- Add query retry to consumers and add missing logging [#18](https://github.com/lblod/app-verenigingen-loket/pull/18)

## 1.1.0 (2024-08-12)

- frontend [v1.1.0](https://github.com/lblod/frontend-verenigingen-loket/blob/master/CHANGELOG.md#v110-2024-08-06)
