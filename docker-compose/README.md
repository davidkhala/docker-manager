


## docker-compose syntax
- [network_mode] use the same values as the docker client `--network` parameter
    - "bridge" | "host" | "none"
- `docker compose ls` provide view if you have multiple Compose projects in use
    - `docker compose -f <config-file.yaml> ps` monitor specific Compose project
- `healthcheck` section
  - https://www.okteto.com/docs/1.4/reference/compose/#healthcheck-object-optional
- The default path for a Compose file is `compose.yaml`
  - Compose also supports `docker-compose.yaml` and `docker-compose.yml` for backwards compatibility of earlier versions.
