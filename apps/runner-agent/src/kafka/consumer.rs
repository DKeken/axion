use crate::config::Config;
use crate::error::{AgentError, Result};
use crate::kafka::types::{CommandEnvelope, CommandType, DeployCommand};
use futures::stream::StreamExt;
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{Consumer, StreamConsumer};
use rdkafka::message::Message;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{error, info, warn};

pub struct KafkaConsumer {
    consumer: Arc<StreamConsumer>,
    config: Arc<Config>,
    shutdown: Arc<RwLock<bool>>,
}

impl KafkaConsumer {
    pub async fn new(config: &Config) -> Result<Self> {
        info!("Initializing Kafka consumer");

        let mut client_config = ClientConfig::new();
        client_config
            .set("bootstrap.servers", config.kafka.brokers.join(","))
            .set("group.id", &config.kafka.consumer_group)
            .set("enable.auto.commit", "true")
            .set("auto.offset.reset", "earliest")
            .set("session.timeout.ms", "30000")
            .set("enable.partition.eof", "false");

        if config.kafka.enable_ssl {
            client_config.set("security.protocol", "ssl");
            if let Some(ca_location) = &config.kafka.ssl_ca_location {
                client_config.set("ssl.ca.location", ca_location);
            }
        }

        let consumer: StreamConsumer = client_config.create()?;

        // Subscribe to agent-specific topic
        // TODO: Get agent_id from somewhere (maybe from config or registration response)
        let agent_id = "temp-agent-id"; // Placeholder
        let topic = format!("runner.commands.{}", agent_id);
        consumer.subscribe(&[&topic])?;

        info!("Subscribed to Kafka topic: {}", topic);

        Ok(Self {
            consumer: Arc::new(consumer),
            config: Arc::new(config.clone()),
            shutdown: Arc::new(RwLock::new(false)),
        })
    }

    pub async fn start(&self) {
        info!("Starting Kafka consumer");

        let mut message_stream = self.consumer.stream();

        loop {
            // Check shutdown flag
            if *self.shutdown.read().await {
                info!("Kafka consumer shutting down");
                break;
            }

            match message_stream.next().await {
                Some(Ok(message)) => {
                    if let Err(e) = self.process_message(&message).await {
                        error!("Failed to process message: {:?}", e);
                    }
                }
                Some(Err(e)) => {
                    error!("Kafka error: {:?}", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                }
                None => {
                    warn!("Message stream ended");
                    break;
                }
            }
        }
    }

    async fn process_message(&self, message: &rdkafka::message::BorrowedMessage<'_>) -> Result<()> {
        let payload = message
            .payload()
            .ok_or_else(|| AgentError::Serialization("Empty message payload".to_string()))?;

        let envelope: CommandEnvelope = serde_json::from_slice(payload)?;

        info!(
            "Received command: {:?} (correlation_id: {})",
            envelope.command_type, envelope.correlation_id
        );

        match envelope.command_type {
            CommandType::Deploy => {
                let deploy_cmd: DeployCommand = serde_json::from_slice(&envelope.payload)?;
                self.handle_deploy_command(deploy_cmd, &envelope.correlation_id)
                    .await?;
            }
            CommandType::Rollback => {
                info!("Handling rollback command");
                // TODO: Implement rollback
            }
            CommandType::Scale => {
                info!("Handling scale command");
                // TODO: Implement scaling
            }
            CommandType::Stop => {
                info!("Handling stop command");
                // TODO: Implement stop
            }
            CommandType::GetStatus => {
                info!("Handling get status command");
                // TODO: Implement status check
            }
            CommandType::HealthCheck => {
                info!("Handling health check command");
                // TODO: Implement health check
            }
            CommandType::Update => {
                info!("Handling update command");
                // TODO: Implement agent update
            }
        }

        Ok(())
    }

    async fn handle_deploy_command(
        &self,
        command: DeployCommand,
        _correlation_id: &str,
    ) -> Result<()> {
        info!(
            "Processing deploy command for project: {}",
            command.project_id
        );

        // TODO: Implement actual deployment logic
        // This will use DockerManager to deploy the stack

        Ok(())
    }

    pub async fn shutdown(&self) -> Result<()> {
        info!("Shutting down Kafka consumer");
        *self.shutdown.write().await = true;
        Ok(())
    }
}
