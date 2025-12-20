use crate::config::Config;
use crate::error::{AgentError, Result};
use bollard::Docker;
use std::sync::Arc;
use tracing::{error, info};

pub struct DockerManager {
    docker: Arc<Docker>,
    _config: Arc<Config>,
}

impl DockerManager {
    pub async fn new(config: &Config) -> Result<Self> {
        info!("Initializing Docker manager");

        // Connect to Docker daemon
        let docker = Docker::connect_with_local_defaults().map_err(|e| AgentError::Docker(e))?;

        // Verify connection
        let version = docker.version().await.map_err(|e| AgentError::Docker(e))?;

        info!("Connected to Docker daemon, version: {:?}", version.version);

        // Check if Swarm is initialized by checking Docker info
        let docker_info = docker.info().await.map_err(|e| AgentError::Docker(e))?;

        if let Some(swarm) = docker_info.swarm {
            if let Some(node_id) = swarm.node_id {
                if !node_id.is_empty() {
                    info!("Docker Swarm is initialized with Node ID: {}", node_id);
                } else {
                    info!("Docker Swarm is not initialized");
                }
            }
        } else {
            info!("Docker Swarm is not available or not initialized");
        }

        Ok(Self {
            docker: Arc::new(docker),
            _config: Arc::new(config.clone()),
        })
    }

    pub async fn deploy_stack(
        &self,
        project_id: &str,
        docker_stack_yml: &str,
        env_vars: &std::collections::HashMap<String, String>,
    ) -> Result<()> {
        info!("Deploying Docker stack for project: {}", project_id);

        // Create project directory
        let project_path = format!("/opt/axion/projects/{}", project_id);
        tokio::fs::create_dir_all(&project_path).await?;

        // Write docker-stack.yml
        let stack_file = format!("{}/docker-stack.yml", project_path);
        tokio::fs::write(&stack_file, docker_stack_yml).await?;

        // Write .env file
        let env_file = format!("{}/.env", project_path);
        let env_content = env_vars
            .iter()
            .map(|(k, v)| format!("{}={}", k, v))
            .collect::<Vec<_>>()
            .join("\n");
        tokio::fs::write(&env_file, env_content).await?;

        // Deploy stack using docker stack deploy
        // Note: bollard doesn't have direct stack deploy, so we use Command
        let output = tokio::process::Command::new("docker")
            .args(&[
                "stack",
                "deploy",
                "-c",
                &stack_file,
                &format!("axion-{}", project_id),
            ])
            .current_dir(&project_path)
            .output()
            .await?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(AgentError::CommandExecution(format!(
                "Failed to deploy stack: {}",
                error
            )));
        }

        info!("Stack deployed successfully for project: {}", project_id);

        Ok(())
    }

    pub async fn get_stack_status(&self, project_id: &str) -> Result<Vec<ServiceStatus>> {
        info!("Getting stack status for project: {}", project_id);

        let stack_name = format!("axion-{}", project_id);

        // List services in the stack
        let services = self
            .docker
            .list_services::<String>(None)
            .await
            .map_err(|e| AgentError::Docker(e))?;

        let mut statuses = Vec::new();

        for service in services {
            if let Some(spec) = &service.spec {
                if let Some(name) = &spec.name {
                    if name.starts_with(&format!("{}_", stack_name)) {
                        statuses.push(ServiceStatus {
                            name: name.clone(),
                            replicas: service
                                .endpoint
                                .as_ref()
                                .and_then(|e| e.ports.as_ref())
                                .map(|p| p.len() as u32)
                                .unwrap_or(0),
                            status: "running".to_string(),
                        });
                    }
                }
            }
        }

        Ok(statuses)
    }

    pub async fn remove_stack(&self, project_id: &str) -> Result<()> {
        info!("Removing stack for project: {}", project_id);

        let stack_name = format!("axion-{}", project_id);

        let output = tokio::process::Command::new("docker")
            .args(&["stack", "rm", &stack_name])
            .output()
            .await?;

        if !output.status.success() {
            let error = String::from_utf8_lossy(&output.stderr);
            return Err(AgentError::CommandExecution(format!(
                "Failed to remove stack: {}",
                error
            )));
        }

        info!("Stack removed successfully for project: {}", project_id);

        Ok(())
    }

    pub async fn health_check(&self) -> Result<bool> {
        match self.docker.ping().await {
            Ok(_) => Ok(true),
            Err(e) => {
                error!("Docker health check failed: {:?}", e);
                Ok(false)
            }
        }
    }
}

#[derive(Debug, Clone)]
pub struct ServiceStatus {
    pub name: String,
    pub replicas: u32,
    pub status: String,
}
