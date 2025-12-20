use crate::config::Config;
use crate::error::{AgentError, Result};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tokio::time;
use tonic::transport::{Channel, Endpoint};
use tracing::{error, info, warn};
use uuid::Uuid;

#[derive(Clone)]
pub struct GrpcClient {
    config: Arc<Config>,
    agent_id: Arc<RwLock<Option<String>>>,
    channel: Arc<RwLock<Option<Channel>>>,
}

impl GrpcClient {
    pub async fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            config: Arc::new(config.clone()),
            agent_id: Arc::new(RwLock::new(None)),
            channel: Arc::new(RwLock::new(None)),
        })
    }

    async fn connect(&self) -> Result<Channel> {
        info!(
            "Connecting to Control Plane gRPC server: {}",
            self.config.control_plane.grpc_url
        );

        let endpoint = Endpoint::from_shared(self.config.control_plane.grpc_url.clone())
            .map_err(|e| AgentError::Config(format!("Invalid gRPC URL: {}", e)))?
            .timeout(Duration::from_secs(self.config.control_plane.timeout))
            .tcp_keepalive(Some(Duration::from_secs(30)))
            .http2_keep_alive_interval(Duration::from_secs(30))
            .keep_alive_timeout(Duration::from_secs(10));

        let channel = endpoint.connect().await?;

        info!("Successfully connected to Control Plane");
        *self.channel.write().await = Some(channel.clone());

        Ok(channel)
    }

    pub async fn register_agent(&self) -> Result<()> {
        info!("Registering agent with Control Plane");

        let _channel = self.connect().await?;

        // TODO: Call actual gRPC registration endpoint
        // For now, generate a UUID as agent ID
        let agent_id = Uuid::new_v4().to_string();
        *self.agent_id.write().await = Some(agent_id.clone());

        info!("Agent registered successfully with ID: {}", agent_id);

        Ok(())
    }

    pub async fn unregister_agent(&self) -> Result<()> {
        let agent_id = self.agent_id.read().await;

        if let Some(id) = agent_id.as_ref() {
            info!("Unregistering agent: {}", id);

            // TODO: Call actual gRPC unregistration endpoint

            info!("Agent unregistered successfully");
        }

        Ok(())
    }

    pub async fn start_heartbeat(&self) {
        let interval = Duration::from_secs(self.config.health.check_interval);
        let mut ticker = time::interval(interval);

        loop {
            ticker.tick().await;

            if let Err(e) = self.send_heartbeat().await {
                error!("Failed to send heartbeat: {:?}", e);
            }
        }
    }

    async fn send_heartbeat(&self) -> Result<()> {
        let agent_id = self.agent_id.read().await;

        if let Some(id) = agent_id.as_ref() {
            // TODO: Call actual gRPC heartbeat endpoint
            info!("Heartbeat sent for agent: {}", id);
        } else {
            warn!("Agent not registered, skipping heartbeat");
        }

        Ok(())
    }

    pub async fn send_metrics(&self, _metrics: Vec<u8>) -> Result<()> {
        // TODO: Implement metrics sending via gRPC
        Ok(())
    }

    pub async fn check_for_updates(&self) -> Result<Option<String>> {
        // TODO: Implement update checking via gRPC
        Ok(None)
    }
}
