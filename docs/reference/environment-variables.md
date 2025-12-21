---
icon: lucide/variable
---

# Environment Variables

Configuration options for Caution applications.

## Application variables

These variables are available to your application at runtime:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Port your web process should bind to | `8080` |

## Procfile usage

Reference variables in your Procfile:

```procfile
web: ./my-app --port $PORT
```

## Build-time variables

These affect the enclave build process:

| Variable | Description | Default |
|----------|-------------|---------|
| `SOURCE_DATE_EPOCH` | Unix timestamp for reproducible builds | `1` |

## CLI configuration

The CLI reads configuration from environment variables and config files.

### Session storage

Location: `~/.config/api-cli/config.json`

### Cache directories

| Path | Purpose |
|------|---------|
| `~/.cache/caution/build/` | Enclave build cache |
| `~/.cache/caution/reproductions/` | Verification build cache |

## API configuration

For self-hosted deployments, the API service uses:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `SESSION_EXPIRY_SECS` | Session timeout in seconds | No |
| `AWS_ACCESS_KEY_ID` | AWS credentials | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | Yes |
| `AWS_REGION` | AWS region | Yes |
| `STRIPE_API_KEY` | Stripe API key (for billing) | No |

## Gateway configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `API_URL` | Backend API URL | Yes |
| `WEBAUTHN_RP_ID` | Relying party ID for WebAuthn | Yes |
| `WEBAUTHN_RP_ORIGIN` | Allowed origins | Yes |

## Terraform/Infrastructure

| Variable | Description |
|----------|-------------|
| `TF_STATE_BUCKET` | S3 bucket for Terraform state |
| `TF_STATE_REGION` | Region for state bucket |

## Learn more

- [Procfile Reference](procfile.md) - Application configuration
- [Managed On-Premises](../guides/managed-on-premises.md) - Self-hosted setup
