---
icon: lucide/terminal
---

# CLI Reference

The Caution CLI is your primary interface for deploying and verifying applications.

## Installation

```bash
curl -fsSL https://caution.co/install.sh | sh
```

## Commands

<div class="grid cards" markdown>

- :lucide-user-plus: **[caution register](register.md)**

    Create a new account with passkey authentication.

- :lucide-log-in: **[caution login](login.md)**

    Authenticate with your passkey.

- :lucide-folder-plus: **[caution init](init.md)**

    Initialize a project for Caution deployment.

- :lucide-box: **[caution apps](apps.md)**

    Manage your deployed applications.

- :lucide-shield-check: **[caution verify](verify.md)**

    Verify a deployed application's integrity.

- :lucide-key: **[caution ssh-keys](ssh-keys.md)**

    Manage SSH keys for git deployment.

- :lucide-info: **[caution describe](describe.md)**

    Show project deployment information.

</div>

## Global options

| Option | Description |
|--------|-------------|
| `--help` | Show help for any command |
| `--version` | Show CLI version |
