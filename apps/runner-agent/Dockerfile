FROM scratch

# Copy the static binary from local build
COPY target/release/axion-agent /usr/local/bin/axion-agent

# Create necessary directories
VOLUME ["/opt/axion", "/var/log/axion"]

# Expose health check port
EXPOSE 8080

# Run as non-root user (will be created by the binary)
USER 1000:1000

ENTRYPOINT ["/usr/local/bin/axion-agent"]
