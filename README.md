# inky-frame-server

Weather dashboard for an 800x480 e-ink display. Bun monorepo: NestJS backend (`backend/`), React + Tailwind frontend (`frontend/`).

## Development

```bash
bun install
bun run frontend:dev   # http://localhost:3010
bun run backend:dev    # http://localhost:3011
```

## Quality toolchain

```bash
bun run lint        # oxlint + biome lint (must exit 0)
bun run lint:fix    # oxlint --fix + biome check --write
bun run format      # biome format --write (whole repo)
bun run coverage    # backend tests + lcov, paths rewritten for Sonar
bun run sonar       # push analysis to SonarQube (needs SONAR_TOKEN env)
```

Configs: `.oxlintrc.json`, `biome.json`, `sonar-project.properties`.

## SonarQube (local)

```bash
docker compose -f docker-compose.sonar.yml up -d   # http://localhost:9000
```

One-time setup: log in as `admin/admin`, change the password, create a user token, then export it:

```bash
export SONAR_TOKEN=squ_...
```

Then:

```bash
bun run coverage && bun run sonar
```

Note: Elasticsearch refuses shards when host disk usage passes the 90% watermark — keep >43GB free on `/`.
