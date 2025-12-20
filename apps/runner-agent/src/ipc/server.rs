// IPC server for local Tauri client communication
// Supports Unix Domain Sockets (Linux/macOS) and Named Pipes (Windows)

use crate::config::Config;
use crate::error::Result;
use std::sync::Arc;
use tracing::info;

pub struct IpcServer {
    _config: Arc<Config>,
}

impl IpcServer {
    pub async fn new(config: &Config) -> Result<Self> {
        Ok(Self {
            _config: Arc::new(config.clone()),
        })
    }

    #[cfg(unix)]
    pub async fn start(&self) -> Result<()> {
        use tokio::net::UnixListener;

        let socket_path = self._config.local.ipc_socket_path.as_ref().ok_or_else(|| {
            crate::error::AgentError::Config("IPC socket path not configured".to_string())
        })?;

        // Remove old socket if exists
        let _ = std::fs::remove_file(socket_path);

        let listener = UnixListener::bind(socket_path)?;

        // Set permissions (owner only)
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(socket_path, std::fs::Permissions::from_mode(0o600))?;
        }

        info!("IPC server listening on: {}", socket_path);

        loop {
            match listener.accept().await {
                Ok((stream, _addr)) => {
                    tokio::spawn(async move {
                        if let Err(e) = Self::handle_client(stream).await {
                            tracing::error!("IPC client error: {:?}", e);
                        }
                    });
                }
                Err(e) => {
                    tracing::error!("IPC accept error: {:?}", e);
                }
            }
        }
    }

    #[cfg(windows)]
    pub async fn start(&self) -> Result<()> {
        use tokio::net::windows::named_pipe::ServerOptions;

        let pipe_name = self._config.local.ipc_pipe_name.as_ref().ok_or_else(|| {
            crate::error::AgentError::Config("IPC pipe name not configured".to_string())
        })?;

        info!("IPC server listening on: {}", pipe_name);

        loop {
            let server = ServerOptions::new()
                .first_pipe_instance(true)
                .create(pipe_name)?;

            server.connect().await?;

            tokio::spawn(async move {
                if let Err(e) = Self::handle_client(server).await {
                    tracing::error!("IPC client error: {:?}", e);
                }
            });
        }
    }

    #[cfg(unix)]
    async fn handle_client(_stream: tokio::net::UnixStream) -> Result<()> {
        // TODO: Implement IPC protocol
        // - Read command from Tauri client
        // - Execute command (deploy, status, etc.)
        // - Send response back

        info!("IPC client connected");
        Ok(())
    }

    #[cfg(windows)]
    async fn handle_client(
        _stream: tokio::net::windows::named_pipe::NamedPipeServer,
    ) -> Result<()> {
        // TODO: Implement IPC protocol for Windows

        info!("IPC client connected");
        Ok(())
    }
}
