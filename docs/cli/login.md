---
icon: lucide/log-in
---

# caution login

Authenticate with your Caution account.

## Usage

```bash
caution login
```

## Description

Authenticates using your registered passkey. Sessions are stored locally and expire after a configured period.

## What happens

1. You'll be prompted for your email address
2. Your security key or platform authenticator will be activated
3. Touch your security key or use biometrics to authenticate
4. A new session is created and stored locally

## Session storage

Sessions are stored in `~/.config/api-cli/config.json`.

## Example

```bash
$ caution login
Email: user@example.com
Touch your security key...
✓ Login successful
```

## See also

- [caution register](register.md) - Create a new account
- [Authentication concepts](../concepts/authentication.md) - How passkey auth works
