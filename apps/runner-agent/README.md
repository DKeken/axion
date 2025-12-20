# Axion Runner Agent

High-performance deployment agent written in Rust for managing Docker Swarm on client servers.

## Features

- 🚀 **High Performance**: Written in Rust for maximum efficiency
- 🔒 **Secure**: TLS encryption, token-based authentication
- 📦 **Static Binary**: Single binary with no dependencies (musl build)
- 🐳 **Docker Swarm**: Advanced container orchestration
- 📊 **Real-time Metrics**: Telemetry collection and reporting
- 🔄 **Auto-update**: Self-updating with rollback support
- 🌐 **gRPC + Kafka**: Type-safe communication with Control Plane
- 💻 **Local Mode**: IPC server for Tauri Desktop Client

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Axion Runner Agent (Rust)                  │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ gRPC Client  │  │    Kafka     │  │   Docker     │ │
│  │   (Tonic)    │  │  (rdkafka)   │  │  (Bollard)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Telemetry   │  │    Health    │  │     IPC      │ │
│  │  Collector   │  │    Server    │  │   Server     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Building

### Development Build

```bash
cargo build
```

### Production Build (Static Binary with musl)

```bash
# Install musl target
rustup target add x86_64-unknown-linux-musl

# Install musl-tools (on Ubuntu/Debian)
sudo apt-get install musl-tools

# Build static binary
cargo build --release --target x86_64-unknown-linux-musl

# Verify static linking
ldd target/x86_64-unknown-linux-musl/release/axion-agent
# Should output: "not a dynamic executable"
```

### Cross-compilation for ARM64

```bash
# Install ARM64 target
rustup target add aarch64-unknown-linux-musl

# Install cross-compilation tools
cargo install cross

# Build for ARM64
cross build --release --target aarch64-unknown-linux-musl
```

## Configuration

Configuration can be provided via:

1. Configuration file: `/etc/axion/agent.toml` or `~/.axion/agent.toml`
2. Environment variables (prefix: `AXION_AGENT__`)

### Example Configuration

```toml
[agent]
token = "your-agent-token"
version = "0.1.0"
update_channel = "stable"
auto_update_enabled = true

[control_plane]
grpc_url = "https://control.axion.dev:443"
timeout = 30
retry_attempts = 3

[kafka]
brokers = ["kafka1:9092", "kafka2:9092"]
consumer_group = "runner-agent-{agent_id}"
enable_ssl = true
ssl_ca_location = "/etc/axion/certs/kafka-ca.pem"

[telemetry]
enabled = true
interval_seconds = 10
batch_size = 100
send_timeout = 5

[health]
check_interval = 30
timeout = 10
failure_threshold = 3
port = 8080

[logging]
level = "info"
format = "json"
file = "/var/log/axion/agent.log"
max_size_mb = 100
max_files = 5

[local]
enabled = false
ipc_socket_path = "/tmp/axion-runner-agent.sock"
grpc_local_port = 50051
```

### Environment Variables

```bash
export AXION_AGENT__AGENT__TOKEN="your-token"
export AXION_AGENT__CONTROL_PLANE__GRPC_URL="https://control.axion.dev:443"
export AXION_AGENT__KAFKA__BROKERS="kafka1:9092,kafka2:9092"
```

## Running

### Standalone

```bash
./axion-agent
```

### With Docker

```bash
docker run -d \
  --name axion-agent \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /opt/axion:/opt/axion \
  -e AXION_AGENT__AGENT__TOKEN="your-token" \
  axion/runner-agent:latest
```

### As systemd Service

```bash
# Copy binary
sudo cp target/release/axion-agent /usr/local/bin/

# Create systemd service file
sudo cp deployment/axion-agent.service /etc/systemd/system/

# Enable and start
sudo systemctl enable axion-agent
sudo systemctl start axion-agent

# Check status
sudo systemctl status axion-agent

# View logs
sudo journalctl -u axion-agent -f
```

## Development

### Project Structure

```
apps/runner-agent/
├── src/
│   ├── main.rs              # Entry point
│   ├── config/              # Configuration management
│   ├── error/               # Error types
│   ├── grpc/                # gRPC client
│   ├── kafka/               # Kafka consumer/producer
│   ├── docker/              # Docker manager
│   ├── telemetry/           # Telemetry collector
│   ├── health/              # Health server
│   ├── command/             # Command executor
│   ├── update/              # Auto-update manager
│   ├── ipc/                 # IPC server for local mode
│   └── utils/               # Utilities
├── proto/                   # Protobuf definitions
├── Cargo.toml               # Dependencies
├── build.rs                 # Build script
└── README.md                # This file
```

### Testing

```bash
# Run tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test
cargo test test_name
```

### Linting

```bash
# Check code
cargo clippy -- -D warnings

# Format code
cargo fmt
```

## Deployment

The agent is automatically installed on servers via the Control Plane when adding a new server. The installation process:

1. Control Plane creates BullMQ job
2. Worker connects via SSH
3. Downloads static binary
4. Creates systemd service
5. Starts agent
6. Agent registers with Control Plane

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

### Metrics

```bash
curl http://localhost:8080/metrics
```

### Logs

```bash
# systemd
journalctl -u axion-agent -f

# File
tail -f /var/log/axion/agent.log
```

## Security

- **TLS**: All gRPC and Kafka connections use TLS
- **Token Authentication**: Agent authenticates with Control Plane using unique token
- **Minimal Privileges**: Runs with minimal Linux capabilities
- **Isolated**: Docker socket access only
- **Encrypted Storage**: Tokens stored encrypted

## License

MIT

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md)
