---
icon: lucide/variable
---

# Environment variables


Configuration options for Caution applications.

## Application variables

Lorem ipsum dolor sit amet:

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Lorem ipsum dolor sit amet | `8080` |

## Procfile usage

Lorem ipsum dolor sit amet:

```procfile
web: ./my-app --port $PORT
```

## Build-time variables

Lorem ipsum dolor sit amet:

| Variable | Description | Default |
|----------|-------------|---------|
| `SOURCE_DATE_EPOCH` | Lorem ipsum dolor sit amet | `1` |

## CLI configuration

Lorem ipsum dolor sit amet.

### Session storage

Location: `~/.config/api-cli/config.json`

### Cache directories

| Path | Purpose |
|------|---------|
| `~/.cache/caution/build/` | Lorem ipsum dolor sit amet |
| `~/.cache/caution/reproductions/` | Lorem ipsum dolor sit amet |

## API configuration

Lorem ipsum dolor sit amet:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Lorem ipsum dolor sit amet | Yes |
| `SESSION_EXPIRY_SECS` | Lorem ipsum dolor sit amet | No |
| `AWS_ACCESS_KEY_ID` | Lorem ipsum dolor sit amet | Yes |
| `AWS_SECRET_ACCESS_KEY` | Lorem ipsum dolor sit amet | Yes |
| `AWS_REGION` | Lorem ipsum dolor sit amet | Yes |
| `STRIPE_API_KEY` | Lorem ipsum dolor sit amet | No |

## Gateway configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Lorem ipsum dolor sit amet | Yes |
| `API_URL` | Lorem ipsum dolor sit amet | Yes |
| `WEBAUTHN_RP_ID` | Lorem ipsum dolor sit amet | Yes |
| `WEBAUTHN_RP_ORIGIN` | Lorem ipsum dolor sit amet | Yes |

## Terraform/Infrastructure

| Variable | Description |
|----------|-------------|
| `TF_STATE_BUCKET` | Lorem ipsum dolor sit amet |
| `TF_STATE_REGION` | Lorem ipsum dolor sit amet |

## Learn more

- [Procfile reference](procfile.md)
- [Managed on-premises](../guides/managed-on-premises.md)
