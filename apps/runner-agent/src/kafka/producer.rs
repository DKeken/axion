use crate::config::Config;
use crate::error::Result;
use crate::kafka::types::{EventEnvelope, EventType};
use chrono::Utc;
use rdkafka::config::ClientConfig;
use rdkafka::producer::{FutureProducer, FutureRecord};
use std::sync::Arc;
use std::time::Duration;
use tracing::{error, info};
use uuid::Uuid;

pub struct KafkaProducer {
    producer: Arc<FutureProducer>,
    config: Arc<Config>,
}

impl KafkaProducer {
    pub async fn new(config: &Config) -> Result<Self> {
        info!("Initializing Kafka producer");

        let mut client_config = ClientConfig::new();
        client_config
            .set("bootstrap.servers", config.kafka.brokers.join(","))
            .set("message.timeout.ms", "30000")
            .set("queue.buffering.max.messages", "100000")
            .set("queue.buffering.max.kbytes", "1048576")
            .set("batch.num.messages", "10000");

        if config.kafka.enable_ssl {
            client_config.set("security.protocol", "ssl");
            if let Some(ca_location) = &config.kafka.ssl_ca_location {
                client_config.set("ssl.ca.location", ca_location);
            }
        }

        let producer: FutureProducer = client_config.create()?;

        info!("Kafka producer initialized");

        Ok(Self {
            producer: Arc::new(producer),
            config: Arc::new(config.clone()),
        })
    }

    pub async fn publish_event(
        &self,
        event_type: EventType,
        payload: Vec<u8>,
        correlation_id: String,
        causation_id: String,
    ) -> Result<()> {
        let agent_id = "temp-agent-id"; // TODO: Get from actual agent registration

        let envelope = EventEnvelope {
            event_id: Uuid::new_v4().to_string(),
            event_type: event_type.clone(),
            payload,
            correlation_id,
            causation_id,
            timestamp: Utc::now(),
            agent_id: agent_id.to_string(),
        };

        let topic = format!("runner.events.{}", agent_id);
        let payload = serde_json::to_vec(&envelope)?;

        let record = FutureRecord::to(&topic)
            .payload(&payload)
            .key(&envelope.event_id);

        match self.producer.send(record, Duration::from_secs(5)).await {
            Ok(_) => {
                info!("Event published: {:?}", event_type);
                Ok(())
            }
            Err((e, _)) => {
                error!("Failed to publish event: {:?}", e);
                Err(e.into())
            }
        }
    }

    pub async fn publish_deploy_event(
        &self,
        project_id: String,
        status: crate::kafka::types::DeployStatus,
        message: String,
        correlation_id: String,
    ) -> Result<()> {
        let event = crate::kafka::types::DeployEvent {
            project_id,
            status,
            message,
            details: None,
        };

        let payload = serde_json::to_vec(&event)?;

        let event_type = match event.status {
            crate::kafka::types::DeployStatus::Started => EventType::DeployStarted,
            crate::kafka::types::DeployStatus::Progressing => EventType::DeployProgress,
            crate::kafka::types::DeployStatus::Completed => EventType::DeployCompleted,
            crate::kafka::types::DeployStatus::Failed => EventType::DeployFailed,
        };

        self.publish_event(event_type, payload, correlation_id.clone(), correlation_id)
            .await
    }
}
