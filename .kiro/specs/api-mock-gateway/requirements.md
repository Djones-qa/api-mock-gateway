# Requirements Document

## Introduction

The API Mock Gateway is a configurable mock server for API testing. It allows developers to define mock endpoints via YAML/JSON configuration files, match incoming requests against those definitions, and return dynamic templated responses. The gateway supports latency simulation, chaos engineering modes, contract validation against OpenAPI specs, and full request logging with an admin dashboard. It is packaged as a Docker container for simple deployment.

## Glossary

- **Gateway**: The Express-based HTTP server that receives incoming requests and routes them to the mock handling pipeline.
- **Mock_Definition**: A YAML or JSON file that specifies one or more endpoint configurations including method, path, matching rules, and response templates.
- **Mock_Loader**: The component responsible for reading, parsing, and validating Mock_Definition files from the filesystem.
- **Request_Matcher**: The component that evaluates an incoming HTTP request against loaded Mock_Definitions to find the best matching endpoint configuration.
- **Response_Renderer**: The component that generates HTTP responses using Handlebars templates populated with request context data.
- **Latency_Simulator**: The middleware that introduces configurable delays before sending responses.
- **Chaos_Engine**: The middleware that randomly injects failures such as HTTP 500 errors, timeouts, or connection resets based on configured probability.
- **Contract_Validator**: The component that validates request and response payloads against OpenAPI/JSON Schema specifications using AJV.
- **Request_Logger**: The middleware that records all incoming requests and outgoing responses for audit purposes.
- **Admin_Dashboard**: The set of API endpoints that expose request logs, statistics, and system status.
- **Mock_Directory**: The filesystem directory containing Mock_Definition files, defaulting to `./mocks/`.
- **Template_Context**: The object containing request data (params, query, headers, body) available to Handlebars templates during response rendering.

## Requirements

### Requirement 1: Mock Definition Loading

**User Story:** As a developer, I want to define mock endpoints in YAML or JSON files, so that I can configure the gateway without writing code.

#### Acceptance Criteria

1. WHEN the Gateway starts, THE Mock_Loader SHALL read all files with `.yaml`, `.yml`, or `.json` extensions from the top-level of the configured Mock_Directory (non-recursive).
2. WHEN a Mock_Definition file contains valid YAML or JSON syntax, THE Mock_Loader SHALL parse the file into an internal endpoint configuration using the file extension to determine the format.
3. IF a Mock_Definition file contains invalid YAML or JSON syntax, THEN THE Mock_Loader SHALL log an error message identifying the file path and parse error, and skip that file without affecting the loading of other files.
4. THE Mock_Loader SHALL support defining multiple endpoint configurations within a single Mock_Definition file.
5. WHEN the Gateway receives a SIGHUP signal or a reload request via the Admin_Dashboard, THE Mock_Loader SHALL re-read all Mock_Definition files from the Mock_Directory without restarting the server, and SHALL continue serving previously loaded configurations for any file that fails to parse during reload.
6. IF the configured Mock_Directory does not exist or is not readable at startup, THEN THE Mock_Loader SHALL log an error message identifying the directory path and start the Gateway with zero endpoint configurations loaded.

### Requirement 2: Request Matching

**User Story:** As a developer, I want the gateway to match incoming requests against mock definitions using multiple criteria, so that I can simulate complex API behaviors.

#### Acceptance Criteria

1. WHEN an incoming request matches a Mock_Definition by HTTP method and path pattern, THE Request_Matcher SHALL select that Mock_Definition for response generation.
2. THE Request_Matcher SHALL support path parameters using colon-prefixed syntax (e.g., `/users/:id`) and make captured values available in the Template_Context.
3. WHERE a Mock_Definition specifies header matching rules, THE Request_Matcher SHALL evaluate request headers case-insensitively against those rules as additional match criteria. Header matching rules SHALL support exact string values and regex patterns.
4. WHERE a Mock_Definition specifies query parameter matching rules, THE Request_Matcher SHALL evaluate request query parameters against those rules as additional match criteria.
5. WHERE a Mock_Definition specifies body matching rules, THE Request_Matcher SHALL evaluate the request body against those rules as additional match criteria.
6. WHEN multiple Mock_Definitions match an incoming request, THE Request_Matcher SHALL select the definition with the most specific matching criteria, where specificity is ranked as: static path segments over parameterized segments, then by number of additional matching rules (headers, query, body) in descending order.
7. IF no Mock_Definition matches an incoming request, THEN THE Gateway SHALL respond with HTTP status 404 and a JSON body containing the unmatched path and method.

### Requirement 3: Response Templating

**User Story:** As a developer, I want to generate dynamic mock responses using templates and request data, so that I can simulate realistic API interactions.

#### Acceptance Criteria

1. WHEN a matched Mock_Definition contains a response body template, THE Response_Renderer SHALL process the template using the Handlebars engine with the Template_Context.
2. THE Response_Renderer SHALL include request path parameters, query parameters, headers, and parsed JSON body in the Template_Context. IF the request body is not valid JSON, THEN THE Response_Renderer SHALL include the raw body as a string in the Template_Context.
3. THE Response_Renderer SHALL support Handlebars helper functions for generating random UUIDs (v4 format), timestamps (ISO 8601 format), and sequential integers (starting at 1, incrementing per invocation for the lifetime of the Gateway process).
4. WHEN a Mock_Definition specifies a static response body (non-template), THE Response_Renderer SHALL return that body without template processing.
5. WHEN a Mock_Definition specifies response headers, THE Gateway SHALL include those headers in the HTTP response.
6. WHEN a Mock_Definition specifies an HTTP status code, THE Gateway SHALL respond with that status code. WHEN a Mock_Definition does not specify an HTTP status code, THE Gateway SHALL respond with HTTP status 200.
7. IF the Response_Renderer encounters a template syntax error, THEN THE Gateway SHALL respond with HTTP status 500 and a JSON body containing the template file path and the error message from the Handlebars engine.

### Requirement 4: Response Templating Round-Trip

**User Story:** As a developer, I want to verify that mock definitions can be serialized and deserialized without data loss, so that I can trust configuration tooling.

#### Acceptance Criteria

1. WHEN a valid Mock_Definition object is serialized to JSON and parsed back by the Mock_Loader, THE Mock_Loader SHALL produce an object that is deeply equal to the original, meaning every field name, value, type, and array ordering is identical.
2. WHEN a valid Mock_Definition object is serialized to YAML and parsed back by the Mock_Loader, THE Mock_Loader SHALL produce an object that is deeply equal to the original, meaning every field name, value, type, and array ordering is identical.
3. THE Mock_Loader SHALL preserve all Mock_Definition fields during round-trip cycles, specifically: method, path, path parameters, header matching rules, query parameter matching rules, body matching rules, response status code, response headers, response body template, latency settings (fixed and range), chaos mode configuration, contract validation references, and metadata.
4. IF a Mock_Definition file fails parsing during a round-trip cycle due to invalid syntax or encoding errors, THEN THE Mock_Loader SHALL report a parse error identifying the file path and the nature of the failure, and SHALL NOT produce a partial or incomplete Mock_Definition object.

### Requirement 5: Latency Simulation

**User Story:** As a developer, I want to simulate network latency on mock endpoints, so that I can test how my application handles slow responses.

#### Acceptance Criteria

1. WHERE a Mock_Definition specifies a fixed delay value in milliseconds (integer between 0 and 30000 inclusive), THE Latency_Simulator SHALL delay the response by that duration with a tolerance of ±50 milliseconds.
2. WHERE a Mock_Definition specifies a delay range with minimum and maximum values in milliseconds (integers between 0 and 30000 inclusive, where minimum is less than or equal to maximum), THE Latency_Simulator SHALL delay the response by a uniformly distributed random duration within that range (inclusive of both bounds).
3. WHEN no delay is configured for a Mock_Definition, THE Latency_Simulator SHALL not introduce any additional delay.
4. THE Latency_Simulator SHALL apply the delay before sending the response body, preserving the configured HTTP status code and response headers unchanged.
5. IF a Mock_Definition specifies a delay value that is negative, exceeds 30000 milliseconds, or specifies a range where minimum is greater than maximum, THEN THE Mock_Loader SHALL log an error message identifying the invalid delay configuration and the file path, and apply no delay for that Mock_Definition.

### Requirement 6: Chaos Mode

**User Story:** As a developer, I want to inject random failures into mock responses, so that I can test my application's error handling and resilience.

#### Acceptance Criteria

1. WHERE chaos mode is enabled for a Mock_Definition with a configured probability (0.0 to 1.0), THE Chaos_Engine SHALL evaluate each incoming request independently using a uniform random number and inject a failure when the random value is less than or equal to the configured probability, such that a probability of 0.0 never injects failures and 1.0 always injects failures.
2. WHEN the Chaos_Engine injects a failure, THE Chaos_Engine SHALL select a failure type with equal probability from the set of failure types configured for that Mock_Definition, where configurable types are: HTTP 500 response, request timeout, and connection reset.
3. WHEN the Chaos_Engine injects an HTTP 500 failure, THE Gateway SHALL respond with HTTP status 500 and a JSON body indicating a simulated server error.
4. WHEN the Chaos_Engine injects a timeout failure, THE Gateway SHALL hold the connection open without responding for a maximum duration of 30 seconds, after which the Gateway SHALL destroy the socket connection.
5. WHEN the Chaos_Engine injects a connection reset failure, THE Gateway SHALL destroy the socket connection immediately without sending any HTTP response.
6. WHEN chaos mode is disabled or not configured for a Mock_Definition, THE Chaos_Engine SHALL pass the request through the response pipeline without modification.
7. THE Chaos_Engine SHALL log each injected failure including the failure type, endpoint path, and timestamp.
8. IF a Mock_Definition specifies a chaos probability value outside the range 0.0 to 1.0, THEN THE Mock_Loader SHALL log a validation error identifying the file path and treat chaos mode as disabled for that Mock_Definition.

### Requirement 7: Contract Validation

**User Story:** As a developer, I want to validate requests and responses against OpenAPI specs, so that I can ensure my mocks conform to the API contract.

#### Acceptance Criteria

1. WHERE a Mock_Definition references an OpenAPI specification file, THE Contract_Validator SHALL load and compile the schema using AJV.
2. WHERE contract validation is enabled and a Mock_Definition specifies a schema for the request endpoint and method, THE Contract_Validator SHALL validate the request body against the corresponding schema.
3. IF a request body fails contract validation, THEN THE Contract_Validator SHALL respond with HTTP status 400 and a JSON body containing at most 10 validation errors from AJV.
4. WHERE contract validation is enabled and a Mock_Definition specifies a schema for the response endpoint, method, and status code, THE Contract_Validator SHALL validate the response body against the corresponding schema.
5. IF a response body fails contract validation, THEN THE Contract_Validator SHALL log a warning containing the endpoint path, status code, and validation errors, and still send the response to the client.
6. IF the referenced OpenAPI specification file cannot be loaded or parsed, THEN THE Contract_Validator SHALL log an error and skip validation for that Mock_Definition.
7. IF the OpenAPI specification does not define a schema for the current endpoint and method combination, THEN THE Contract_Validator SHALL skip validation for that request and pass it through without modification.

### Requirement 8: Request Logging

**User Story:** As a developer, I want a full audit trail of all requests and responses, so that I can debug API interactions during testing.

#### Acceptance Criteria

1. THE Request_Logger SHALL record the timestamp in ISO 8601 format, HTTP method, path, headers, query parameters, and body (up to 1 MB) for every incoming request.
2. THE Request_Logger SHALL record the HTTP status code, response headers, response body (up to 1 MB), and response time in milliseconds (measured from request receipt to response send) for every outgoing response.
3. THE Request_Logger SHALL store log entries in memory with a configurable maximum capacity (default: 1000 entries, minimum: 1).
4. WHEN the log storage reaches maximum capacity, THE Request_Logger SHALL remove the oldest entry before storing a new entry (FIFO eviction).
5. THE Request_Logger SHALL assign a UUID v4 correlation ID to each request-response pair for traceability.
6. IF a request or response body exceeds 1 MB, THEN THE Request_Logger SHALL truncate the stored body at 1 MB and include a flag indicating the body was truncated.
7. THE Request_Logger SHALL store log entries in chronological order based on request receipt time.

### Requirement 9: Admin Dashboard API

**User Story:** As a developer, I want an admin API to view logs and statistics, so that I can monitor the mock gateway's behavior during test runs.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL expose a GET endpoint at `/__admin/logs` that returns all stored request log entries as a JSON array sorted by timestamp in descending order (most recent first).
2. THE Admin_Dashboard SHALL expose a GET endpoint at `/__admin/logs/:id` that returns a single log entry by correlation ID.
3. IF a requested log entry correlation ID does not exist, THEN THE Admin_Dashboard SHALL respond with HTTP status 404 and a JSON body containing an error message indicating the correlation ID was not found.
4. THE Admin_Dashboard SHALL expose a GET endpoint at `/__admin/stats` that returns aggregate statistics as a JSON object including: total request count, requests per endpoint (grouped by method and path), average response time in milliseconds, and error count (defined as responses with HTTP status codes 400 or above).
5. THE Admin_Dashboard SHALL expose a DELETE endpoint at `/__admin/logs` that clears all stored log entries, resets aggregate statistics to zero, and returns HTTP status 204 with no response body.
6. THE Admin_Dashboard SHALL expose a GET endpoint at `/__admin/health` that returns HTTP status 200 with a JSON body containing the Gateway uptime in seconds and the count of currently loaded Mock_Definitions.

### Requirement 10: Docker Deployment

**User Story:** As a developer, I want to run the mock gateway in a Docker container, so that I can deploy it quickly in any environment.

#### Acceptance Criteria

1. THE Gateway SHALL provide a Dockerfile that builds a container image using a multi-stage build based on Node.js 20 Alpine, running the application as a non-root user and including only production dependencies.
2. THE Gateway SHALL provide a docker-compose.yml file that starts the Gateway with a volume-mounted Mock_Directory and exposes the configured port to the host.
3. WHEN the Docker container starts with the `PORT` environment variable set to an integer between 1 and 65535, THE Gateway SHALL listen on that specified port.
4. THE Gateway SHALL accept configuration via environment variables: `MOCK_GW_PORT` (port number, default: 3000), `MOCK_GW_MOCK_DIR` (mock directory path, default: `./mocks/`), `MOCK_GW_LOG_CAPACITY` (log capacity as a positive integer, default: 1000), and `MOCK_GW_CHAOS_ENABLED` (chaos mode global enable/disable, values: `true` or `false`, default: `false`).
5. IF the `PORT` environment variable is not set or is empty, THEN THE Gateway SHALL default to listening on port 3000.
6. IF the `PORT` environment variable is set to a non-integer value or an integer outside the range 1–65535, THEN THE Gateway SHALL log an error message indicating the invalid port value and exit with a non-zero exit code.
7. THE Dockerfile SHALL define a HEALTHCHECK instruction that polls the `/__admin/health` endpoint and marks the container as unhealthy if the endpoint does not respond with HTTP status 200 within 3 seconds.

### Requirement 11: Configuration Management

**User Story:** As a developer, I want to configure the gateway through environment variables and config files, so that I can customize behavior per environment.

#### Acceptance Criteria

1. THE Gateway SHALL read configuration from environment variables with the prefix `MOCK_GW_`, mapping variable names to configuration keys by stripping the prefix and converting to lowercase with underscores as separators (e.g., `MOCK_GW_PORT` maps to `port`, `MOCK_GW_MOCK_DIR` maps to `mock_dir`).
2. THE Gateway SHALL support a configuration file at the project root named `gateway.config.yaml` or `gateway.config.json`. IF both files exist, THEN THE Gateway SHALL use `gateway.config.yaml` and ignore `gateway.config.json`.
3. WHEN both environment variables and a configuration file are present, THE Gateway SHALL give precedence to environment variables over configuration file values.
4. IF no configuration is provided, THEN THE Gateway SHALL start with the following default values: port = 3000, mock directory = `./mocks/`, log capacity = 1000 entries, chaos mode = disabled.
5. IF a configuration file contains invalid YAML or JSON syntax, THEN THE Gateway SHALL log an error message identifying the file path and parse error, and start using default values for any options not provided via environment variables.
6. IF a configuration value fails validation (e.g., port is not an integer between 1 and 65535, or log capacity is not a positive integer), THEN THE Gateway SHALL log an error message identifying the invalid key and value, and use the default value for that option.
