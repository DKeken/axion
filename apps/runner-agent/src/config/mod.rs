use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub agent: AgentConfig,
    pub control_plane: ControlPlaneConfig,
    pub kafka: KafkaConfig,
    pub telemetry: TelemetryConfig,
    pub health: HealthConfig,
    pub update: UpdateConfig,
    pub logging: LoggingConfig,
    pub security: SecurityConfig,
    pub local: LocalConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    pub token: String,
    pub version: String,
    pub update_channel: String,
    pub auto_update_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ControlPlaneConfig {
    pub grpc_url: String,
    pub timeout: u64,
    pub retry_attempts: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KafkaConfig {
    pub brokers: Vec<String>,
    pub consumer_group: String,
    pub enable_ssl: bool,
    pub ssl_ca_location: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryConfig {
    pub enabled: bool,
    pub interval_seconds: u64,
    pub batch_size: usize,
    pub send_timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthConfig {
    pub check_interval: u64,
    pub timeout: u64,
    pub failure_threshold: u32,
    pub port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateConfig {
    pub check_interval: u64,
    pub download_timeout: u64,
    pub install_timeout: u64,
    pub rollback_on_failure: bool,
    pub max_backups: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub format: String,
    pub file: PathBuf,
    pub max_size_mb: u64,
    pub max_files: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub tls_verify: bool,
    pub tls_ca_location: Option<PathBuf>,
    pub min_tls_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalConfig {
    pub enabled: bool,
    #[cfg(unix)]
    pub ipc_socket_path: Option<String>,
    #[cfg(windows)]
    pub ipc_pipe_name: Option<String>,
    pub grpc_local_port: Option<u16>,
}

impl Config {
    /// Load configuration from file and environment variables
    pub fn load() -> Result<Self> {
        let mut builder = config::Config::builder();

        // Load from default config file if exists
        let config_paths = vec![
            "/etc/axion/agent.toml",
            "~/.axion/agent.toml",
            "./agent.toml",
        ];

        for path in config_paths {
            let expanded_path = shellexpand::tilde(path);
            if std::path::Path::new(expanded_path.as_ref()).exists() {
                builder = builder.add_source(config::File::with_name(&expanded_path));
                break;
            }
        }

        // Override with environment variables
        builder = builder.add_source(
            config::Environment::with_prefix("AXION_AGENT")
                .separator("__")
                .try_parsing(true),
        );

        let config = builder.build().context("Failed to build configuration")?;

        let config: Config = config
            .try_deserialize()
            .context("Failed to deserialize configuration")?;

        config.validate()?;

        Ok(config)
    }

    /// Validate configuration values
    fn validate(&self) -> Result<()> {
        anyhow::ensure!(!self.agent.token.is_empty(), "Agent token cannot be empty");

        anyhow::ensure!(
            !self.control_plane.grpc_url.is_empty(),
            "Control Plane gRPC URL cannot be empty"
        );

        anyhow::ensure!(
            !self.kafka.brokers.is_empty(),
            "Kafka brokers cannot be empty"
        );

        Ok(())
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            agent: AgentConfig {
                token: String::new(),
                version: env!("CARGO_PKG_VERSION").to_string(),
                update_channel: "stable".to_string(),
                auto_update_enabled: true,
            },
            control_plane: ControlPlaneConfig {
                grpc_url: "https://control.axion.dev:443".to_string(),
                timeout: 30,
                retry_attempts: 3,
            },
            kafka: KafkaConfig {
                brokers: vec!["localhost:9092".to_string()],
                consumer_group: format!("runner-agent-{}", uuid::Uuid::new_v4()),
                enable_ssl: false,
                ssl_ca_location: None,
            },
            telemetry: TelemetryConfig {
                enabled: true,
                interval_seconds: 10,
                batch_size: 100,
                send_timeout: 5,
            },
            health: HealthConfig {
                check_interval: 30,
                timeout: 10,
                failure_threshold: 3,
                port: 8080,
            },
            update: UpdateConfig {
                check_interval: 3600,
                download_timeout: 300,
                install_timeout: 60,
                rollback_on_failure: true,
                max_backups: 5,
            },
            logging: LoggingConfig {
                level: "info".to_string(),
                format: "json".to_string(),
                file: PathBuf::from("/var/log/axion/agent.log"),
                max_size_mb: 100,
                max_files: 5,
            },
            security: SecurityConfig {
                tls_verify: true,
                tls_ca_location: None,
                min_tls_version: "1.2".to_string(),
            },
            local: LocalConfig {
                enabled: false,
                #[cfg(unix)]
                ipc_socket_path: Some("/tmp/axion-runner-agent.sock".to_string()),
                #[cfg(windows)]
                ipc_pipe_name: Some(r"\\.\pipe\axion-runner-agent".to_string()),
                grpc_local_port: Some(50051),
            },
        }
    }
}
