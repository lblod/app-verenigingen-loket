Add your `.pem` files to this directory. Make sure the necessary migrations have been added per local govt to link the client id.

The same key is used for all clients (As noted by Magda connections, not necessary to make it more complex). Hence - same JWK config should be added for all clients in beheerportaal.

# HOWTO: Add a new client configuration from scratch

## 1. Add JWK config to beheerportaal

## 2. Add key to this directory

## 3. Add migration to link client id to admin unit

Note: Bulk loads will be automated.

`config/dev-migrations/client-id.graph`

```
http://mu.semte.ch/graphs/client-configurations
```

`config/dev-migrations/client-id.ttl` replace

- `YOUR_CLIENT_ID_HERE` from `https://beheerportaal-ti.vlaanderen.be/` or `https://beheerportaal.vlaanderen.be/`
  - Note this is the `Client-ID` and **NOT** the `ClientID API`.
- `BESTUURSEENHEID_URI_HERE` with the URI of the admin unit you want to link the client to (e.g. `http://data.lblod.info/id/bestuurseenheden/011a6ad0efca0b7e03ca9b99bd6c636a26cbde49aa0d6844b9ebc434dc58216c` for Affligem)
- `CLIENT_ID_HERE` with a client id, such as `<http://data.lblod.info/id/oauth-config/sample-client-1>`

```
@prefix ext: <http://mu.semte.ch/vocabularies/ext/> .
@prefix dct: <http://purl.org/dc/terms/> .
@prefix wotsec: <https://www.w3.org/2019/wot/security#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

# Sample client configuration for admin unit
# This configuration links an admin unit (Affligem) to its OAuth2 client credentials (Currently ABB)

`BESTUURSEENHEID_URI_HERE`
  ext:hasSecurityScheme `CLIENT_ID_HERE` .

`CLIENT_ID_HERE`
  a wotsec:OAuth2SecurityScheme ;
  dct:identifier YOUR_CLIENT_ID_HERE .

```

