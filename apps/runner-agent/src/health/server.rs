use crate::config::Config;
use crate::error::Result;
use axum::{extract::State, http::StatusCode, response::Json, routing::get, Router};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tracing::info;

#[derive(Clone)]
pub struct HealthServer {
    config: Arc<Config>,
}

#[derive(Debug, Serialize, Deserialize)]
struct HealthResponse {
    status: String,
    version: String,
    uptime: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct MetricsResponse {
    agent_uptime_seconds: u64,
    // Add more metrics here
}

impl HealthServer {
    pub fn new(config: &Config) -> Self {
        Self {
            config: Arc::new(config.clone()),
        }
    }

    pub async fn start(self) -> Result<()> {
        let app = Router::new()
            .route("/health", get(health_handler))
            .route("/metrics", get(metrics_handler))
            .with_state(self.clone());

        let addr = SocketAddr::from(([0, 0, 0, 0], self.config.health.port));
        info!("Health server listening on {}", addr);

        let listener = tokio::net::TcpListener::bind(addr).await?;
        axum::serve(listener, app).await?;

        Ok(())
    }
}

async fn health_handler(State(_state): State<HealthServer>) -> (StatusCode, Json<HealthResponse>) {
    (
        StatusCode::OK,
        Json(HealthResponse {
            status: "healthy".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            uptime: 0, // TODO: Calculate actual uptime
        }),
    )
}

async fn metrics_handler(
    State(_state): State<HealthServer>,
) -> (StatusCode, Json<MetricsResponse>) {
    (
        StatusCode::OK,
        Json(MetricsResponse {
            agent_uptime_seconds: 0, // TODO: Calculate actual uptime
        }),
    )
}
