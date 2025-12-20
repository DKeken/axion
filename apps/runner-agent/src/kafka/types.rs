use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandEnvelope {
    pub command_id: String,
    pub command_type: CommandType,
    pub payload: Vec<u8>,
    pub correlation_id: String,
    pub causation_id: Option<String>,
    pub timestamp: DateTime<Utc>,
    pub metadata: CommandMetadata,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommandType {
    Deploy,
    Rollback,
    Scale,
    Stop,
    GetStatus,
    HealthCheck,
    Update,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandMetadata {
    pub user_id: Option<String>,
    pub project_id: Option<String>,
    pub retry_attempt: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventEnvelope {
    pub event_id: String,
    pub event_type: EventType,
    pub payload: Vec<u8>,
    pub correlation_id: String,
    pub causation_id: String,
    pub timestamp: DateTime<Utc>,
    pub agent_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    DeployStarted,
    DeployProgress,
    DeployCompleted,
    DeployFailed,
    RollbackStarted,
    RollbackCompleted,
    RollbackFailed,
    StatusReport,
    MetricsReport,
    ErrorReport,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeployCommand {
    pub project_id: String,
    pub docker_stack_yml: String,
    pub env_vars: std::collections::HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeployEvent {
    pub project_id: String,
    pub status: DeployStatus,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DeployStatus {
    Started,
    Progressing,
    Completed,
    Failed,
}
