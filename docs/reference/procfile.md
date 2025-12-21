---
icon: lucide/file-code
---

# Procfile Reference

Configure how your application runs on Caution.

## Overview

A `Procfile` defines the processes that make up your application. Caution uses this to understand how to run your workloads.

## Format

```procfile
<process-type>: <command>
```

## Example

```procfile
web: python app.py
worker: python worker.py
```

## Process types

### `web`

The main web process that receives HTTP traffic.

```procfile
web: gunicorn app:app --bind 0.0.0.0:$PORT
```

### `worker`

Background worker processes.

```procfile
worker: celery -A tasks worker
```

### Custom processes

You can define any custom process type:

```procfile
scheduler: python scheduler.py
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `$PORT` | The port your web process should bind to |

## Options

<!-- TODO: Document Caution-specific Procfile options -->

## Learn more

- [Quickstart](../get-started/quickstart.md)
