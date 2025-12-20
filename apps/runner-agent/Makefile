.PHONY: help build build-release build-musl build-aarch64 test check fmt clippy clean install run docker

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build debug version
	cargo build

build-release: ## Build release version
	cargo build --release

build-musl: ## Build static binary with musl (x86_64)
	rustup target add x86_64-unknown-linux-musl
	cargo build --release --target x86_64-unknown-linux-musl

build-aarch64: ## Build static binary for ARM64
	cargo install cross --git https://github.com/cross-rs/cross || true
	cross build --release --target aarch64-unknown-linux-musl

verify-static: ## Verify that binary is statically linked
	@echo "Checking static linking..."
	@ldd target/x86_64-unknown-linux-musl/release/axion-agent || echo "✓ Binary is statically linked"
	@file target/x86_64-unknown-linux-musl/release/axion-agent

test: ## Run tests
	cargo test

test-verbose: ## Run tests with output
	cargo test -- --nocapture

check: ## Check code without building
	cargo check --all-targets --all-features

fmt: ## Format code
	cargo fmt

fmt-check: ## Check code formatting
	cargo fmt -- --check

clippy: ## Run clippy linter
	cargo clippy --all-targets --all-features -- -D warnings

clean: ## Clean build artifacts
	cargo clean

install: build-release ## Install binary to /usr/local/bin (requires sudo)
	sudo cp target/release/axion-agent /usr/local/bin/
	sudo chmod +x /usr/local/bin/axion-agent

run: ## Run agent in development mode
	RUST_LOG=debug cargo run

docker-build: build-musl ## Build Docker image
	docker build -t axion-runner-agent:latest .

docker-run: ## Run Docker container
	docker run -it --rm \
		-v /var/run/docker.sock:/var/run/docker.sock \
		-v /opt/axion:/opt/axion \
		-e AXION_AGENT__AGENT__TOKEN="test-token" \
		axion-runner-agent:latest

ci: fmt-check clippy test ## Run all CI checks

all: check test build-musl ## Run checks, tests and build musl binary
