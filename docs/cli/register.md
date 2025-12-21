---
icon: lucide/user-plus
---

# caution register

Create a new Caution account using passkey authentication.

## Usage

```bash
caution register
```

## Description

Registers a new user account with Caution using FIDO2/WebAuthn passkey authentication. This eliminates the need for passwords entirely.

## What happens

1. You'll be prompted for your email address
2. You'll need to enter a beta code (during early access)
3. Your security key or platform authenticator will be activated
4. Touch your security key or use biometrics to complete registration
5. A session is automatically created upon successful registration

## Requirements

- A FIDO2-compatible security key (YubiKey, etc.) or platform authenticator (Touch ID, Windows Hello)
- A valid beta code (during early access period)

## Example

```bash
$ caution register
Email: user@example.com
Beta code: CAUTION-XXXX-XXXX
Touch your security key...
✓ Registration successful
```

## See also

- [caution login](login.md) - Authenticate after registration
- [Authentication concepts](../concepts/authentication.md) - How passkey auth works
