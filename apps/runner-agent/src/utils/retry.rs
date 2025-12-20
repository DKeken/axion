use std::time::Duration;
use tokio_retry::strategy::{jitter, ExponentialBackoff};
use tokio_retry::Retry;
use tracing::{error, warn};

pub struct RetryPolicy {
    max_retries: usize,
    initial_delay: Duration,
    max_delay: Duration,
}

impl RetryPolicy {
    pub fn new(max_retries: usize) -> Self {
        Self {
            max_retries,
            initial_delay: Duration::from_millis(100),
            max_delay: Duration::from_secs(30),
        }
    }

    pub fn with_delays(max_retries: usize, initial_delay: Duration, max_delay: Duration) -> Self {
        Self {
            max_retries,
            initial_delay,
            max_delay,
        }
    }

    pub async fn execute<F, Fut, T, E>(&self, operation: F) -> Result<T, E>
    where
        F: Fn() -> Fut,
        Fut: std::future::Future<Output = Result<T, E>>,
        E: std::fmt::Display,
    {
        let retry_strategy = ExponentialBackoff::from_millis(self.initial_delay.as_millis() as u64)
            .max_delay(self.max_delay)
            .take(self.max_retries)
            .map(jitter);

        Retry::spawn(retry_strategy, || async {
            match operation().await {
                Ok(result) => Ok(result),
                Err(e) => {
                    warn!("Operation failed, will retry: {}", e);
                    Err(e)
                }
            }
        })
        .await
    }
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self::new(3)
    }
}
