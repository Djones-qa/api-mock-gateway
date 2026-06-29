# API Mock Gateway

[![CI](https://github.com/Djones-qa/api-mock-gateway/actions/workflows/ci.yaml/badge.svg)](https://github.com/Djones-qa/api-mock-gateway/actions/workflows/ci.yaml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A configurable mock server for API testing. Define endpoints in YAML/JSON, match requests by method, path, headers, query, and body, then return dynamic templated responses with latency simulation, chaos engineering, and contract validation.

## Features

| Feature | What it does |
|---------|-------------|
| YAML/JSON Mock Definitions | Define endpoints in simple config files |
| Request Matching | Match by method, path params, headers, query, body |
| Response Templating | Dynamic responses using Handlebars + request data |
| Latency Simulation | Fixed or random delays per endpoint |
| Chaos Mode | Inject 500s, timeouts, connection resets |
| Contract Validation | Validate against OpenAPI specs with AJV |
| Request Logging | Full audit trail + admin dashboard endpoint |
| Docker Ready | Dockerfile + docker-compose for one-command deploy |

## Tech Stack

Node.js 20 · TypeScript · Express · Handlebars · AJV · Jest · GitHub Actions · Docker

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm run dev

# Or run with Docker
docker-compose up
```

## Configuration

The gateway can be configured via environment variables (prefixed `MOCK_GW_`) or a config file (`gateway.config.yaml` / `gateway.config.json`).

| Variable | Default | Description |
|----------|---------|-------------|
| `MOCK_GW_PORT` | `3000` | Server port |
| `MOCK_GW_MOCK_DIR` | `./mocks/` | Mock definitions directory |
| `MOCK_GW_LOG_CAPACITY` | `1000` | Max log entries in memory |
| `MOCK_GW_CHAOS_ENABLED` | `false` | Global chaos mode toggle |

## Mock Definition Example

```yaml
- method: GET
  path: /users/:id
  response:
    status: 200
    headers:
      Content-Type: application/json
    body: |
      {
        "id": "{{params.id}}",
        "name": "User {{params.id}}",
        "createdAt": "{{timestamp}}"
      }
  delay:
    min: 100
    max: 500
```

## Admin API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/__admin/logs` | GET | View all request logs |
| `/__admin/logs/:id` | GET | View single log by correlation ID |
| `/__admin/logs` | DELETE | Clear all logs |
| `/__admin/stats` | GET | View aggregate statistics |
| `/__admin/health` | GET | Health check (uptime + mock count) |

## Project Structure

```
api-mock-gateway/
├── src/
│   ├── server/          # Express app, router, entry point
│   ├── mocks/           # Loader, matcher, responder
│   ├── middleware/      # Logger, delay, chaos, validator
│   ├── contracts/       # OpenAPI/JSON Schema validator
│   ├── dashboard/       # Admin API routes
│   └── utils/           # Config, template engine, types
├── mocks/               # Mock definition files (YAML/JSON)
├── tests/               # Unit, integration, e2e tests
├── docker/              # Dockerfile
└── .github/workflows/   # CI pipeline
```

## Author

**Darrius Jones**

- GitHub: [@Djones-qa](https://github.com/Djones-qa)
- LinkedIn: [darrius-jones-28226b350](https://www.linkedin.com/in/darrius-jones-28226b350)

## License

MIT © 2026 Darrius Jones — see [LICENSE](LICENSE) for details.
