mod command;
mod config;
mod docker;
mod error;
mod grpc;
mod health;
mod ipc;
mod kafka;
mod telemetry;
mod update;
mod utils;

use anyhow::Result;
use config::Config;
use std::sync::Arc;
use tracing::{error, info};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    init_tracing()?;

    info!("Starting Axion Runner Agent v{}", env!("CARGO_PKG_VERSION"));

    // Load configuration
    let config = Config::load()?;
    info!("Configuration loaded successfully");

    // Create graceful shutdown handler
    let shutdown_signal = utils::shutdown::create_shutdown_signal();

    // Initialize components
    let grpc_client = grpc::client::GrpcClient::new(&config).await?;
    info!("gRPC client initialized");

    let kafka_consumer = Arc::new(kafka::consumer::KafkaConsumer::new(&config).await?);
    info!("Kafka consumer initialized");

    let _kafka_producer = kafka::producer::KafkaProducer::new(&config).await?;
    info!("Kafka producer initialized");

    let _docker_manager = docker::manager::DockerManager::new(&config).await?;
    info!("Docker manager initialized");

    let telemetry_collector = telemetry::collector::TelemetryCollector::new(&config).await?;
    info!("Telemetry collector initialized");

    // Start health check server
    let health_server = health::server::HealthServer::new(&config);
    tokio::spawn(async move {
        if let Err(e) = health_server.start().await {
            error!("Health server error: {:?}", e);
        }
    });
    info!("Health server started");

    // Register agent with Control Plane
    grpc_client.register_agent().await?;
    info!("Agent registered with Control Plane");

    // Start heartbeat task
    let heartbeat_client = grpc_client.clone();
    tokio::spawn(async move {
        heartbeat_client.start_heartbeat().await;
    });
    info!("Heartbeat task started");

    // Start Kafka consumer
    let consumer_for_task = Arc::clone(&kafka_consumer);
    let _consumer_handle = tokio::spawn(async move {
        consumer_for_task.start().await;
    });
    info!("Kafka consumer started");

    // Start telemetry collection
    let _telemetry_handle = tokio::spawn(async move {
        telemetry_collector.start().await;
    });
    info!("Telemetry collector started");

    // Start IPC server for local Tauri client communication
    if config.local.enabled {
        let ipc_server = ipc::server::IpcServer::new(&config).await?;
        tokio::spawn(async move {
            if let Err(e) = ipc_server.start().await {
                error!("IPC server error: {:?}", e);
            }
        });
        info!("IPC server started for local mode");
    }

    info!("Axion Runner Agent is running");

    // Wait for shutdown signal
    shutdown_signal.await;
    info!("Shutdown signal received, starting graceful shutdown...");

    // Graceful shutdown
    // 1. Stop accepting new commands
    kafka_consumer.shutdown().await?;

    // 2. Complete running tasks
    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

    // 3. Unregister agent
    grpc_client.unregister_agent().await?;

    info!("Axion Runner Agent shutdown complete");
    Ok(())
}

fn init_tracing() -> Result<()> {
    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(filter)
        .with(tracing_subscriber::fmt::layer().json())
        .init();

    Ok(())
}
