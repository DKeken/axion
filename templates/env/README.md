# Environment Configuration Templates

This directory contains environment configuration templates for Axion Stack services.

## Usage

1. Copy `.env.example` to your service directory as `.env`
2. Fill in the required values
3. For production, use environment variables or secrets management

## Required Variables

### Common (All Services)

- `PORT` - HTTP server port
- `NODE_ENV` - Environment (development/production)
- `POSTGRES_URL` - PostgreSQL connection string
- `KAFKA_BROKERS` - Kafka broker addresses (comma-separated)
- `REDIS_URL` - Redis connection string (for BullMQ)
- `BETTER_AUTH_SECRET` - Secret key for Better Auth
- `BETTER_AUTH_URL` - Base URL for Better Auth

### Optional

- `KAFKA_SASL_USERNAME` - Kafka SASL username (if using authentication)
- `KAFKA_SASL_PASSWORD` - Kafka SASL password
- `KAFKA_SASL_MECHANISM` - Kafka SASL mechanism (default: scram-sha-512)
- `LOG_LEVEL` - Logging level (default: info)

### Service-Specific

- `OPENROUTER_API_KEY` - OpenRouter API key (Codegen Service only)

## Validation

Services should validate required environment variables on startup and provide clear error messages if any are missing.

## Security

- Never commit `.env` files to version control
- Use secrets management in production (AWS Secrets Manager, HashiCorp Vault, etc.)
- Rotate secrets regularly
- Use different secrets for each environment
