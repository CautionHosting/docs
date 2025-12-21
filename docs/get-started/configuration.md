---
icon: lucide/settings
---

# Configuration

Configure your Caution applications using environment variables and Procfiles.

## Procfile

The Procfile defines how your application runs. It specifies the commands to start your processes.

```
web: ./my-app --port $PORT
worker: ./worker
```

See the [Procfile reference](../reference/procfile.md) for detailed documentation.

## Environment variables

Caution provides several built-in environment variables to your application:

| Variable | Description |
|----------|-------------|
| `PORT` | The port your application should listen on |
| `CAUTION_APP_ID` | Your application's unique identifier |

See [Environment Variables](../reference/environment-variables.md) for the complete list.

## Application settings

Configure your application's behavior through the Caution CLI:

```bash
# Set environment variables
caution config set MY_VAR=value

# View current configuration
caution config list
```

## Next steps

- [Procfile reference](../reference/procfile.md)
- [Environment variables](../reference/environment-variables.md)
- [Deterministic apps](../guides/deterministic-apps.md)
