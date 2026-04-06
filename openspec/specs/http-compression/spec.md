## Requirements

### Requirement: HTTP responses are compressed

The server SHALL compress HTTP response bodies using gzip or deflate encoding when the client sends an `Accept-Encoding` header indicating support.

#### Scenario: Client requests gzip compression

- **WHEN** a client sends a request with `Accept-Encoding: gzip`
- **THEN** the response body SHALL be gzip-compressed and include `Content-Encoding: gzip` header

#### Scenario: Client does not request compression

- **WHEN** a client sends a request without an `Accept-Encoding` header
- **THEN** the response body SHALL be sent uncompressed

#### Scenario: Small response bodies are not compressed

- **WHEN** the response body is smaller than the compression threshold (default 1KB)
- **THEN** the response body SHALL be sent uncompressed to avoid overhead
