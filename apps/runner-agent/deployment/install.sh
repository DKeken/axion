#!/bin/bash
set -e

echo "Installing Axion Runner Agent..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exit 1
fi

# Variables
BINARY_URL="${BINARY_URL:-https://releases.axion.dev/runner-agent/latest/axion-agent-x86_64-linux-musl}"
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="/etc/axion"
LOG_DIR="/var/log/axion"
DATA_DIR="/opt/axion"

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        BINARY_URL="${BINARY_URL:-https://releases.axion.dev/runner-agent/latest/axion-agent-x86_64-linux-musl}"
        ;;
    aarch64|arm64)
        BINARY_URL="${BINARY_URL:-https://releases.axion.dev/runner-agent/latest/axion-agent-aarch64-linux-musl}"
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

echo "Detected architecture: $ARCH"

# Create directories
mkdir -p "$CONFIG_DIR" "$LOG_DIR" "$DATA_DIR"

# Download binary
echo "Downloading agent binary..."
curl -L -o /tmp/axion-agent "$BINARY_URL"
chmod +x /tmp/axion-agent

# Verify binary (optional, requires checksum)
if [ -n "$CHECKSUM" ]; then
    echo "Verifying checksum..."
    echo "$CHECKSUM /tmp/axion-agent" | sha256sum -c -
fi

# Install binary
echo "Installing binary to $INSTALL_DIR..."
mv /tmp/axion-agent "$INSTALL_DIR/axion-agent"

# Create config file if doesn't exist
if [ ! -f "$CONFIG_DIR/agent.toml" ]; then
    echo "Creating default config..."
    cat > "$CONFIG_DIR/agent.toml" <<EOF
[agent]
token = ""
version = "0.1.0"
update_channel = "stable"

[control_plane]
grpc_url = "https://control.axion.dev:443"

[kafka]
brokers = ["kafka.axion.dev:9092"]
consumer_group = "runner-agent-{agent_id}"

[logging]
level = "info"
format = "json"
file = "$LOG_DIR/agent.log"
EOF
fi

# Install systemd service
if command -v systemctl &> /dev/null; then
    echo "Installing systemd service..."
    cat > /etc/systemd/system/axion-agent.service <<EOF
[Unit]
Description=Axion Runner Agent
After=network-online.target docker.service
Wants=network-online.target
Requires=docker.service

[Service]
Type=simple
User=root
ExecStart=$INSTALL_DIR/axion-agent
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable axion-agent
    
    echo "Starting agent..."
    systemctl start axion-agent
    
    echo "Agent status:"
    systemctl status axion-agent
else
    echo "systemd not found, please start agent manually"
fi

echo "Installation complete!"
echo ""
echo "Configuration file: $CONFIG_DIR/agent.toml"
echo "Logs: $LOG_DIR/agent.log"
echo ""
echo "To set agent token:"
echo "  export AXION_AGENT__AGENT__TOKEN='your-token'"
echo "  systemctl restart axion-agent"
