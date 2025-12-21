---
icon: lucide/fingerprint
---

# Authentication

Passwordless authentication with passkeys.

## No passwords

Caution uses FIDO2/WebAuthn passkeys exclusively. There are no passwords to:

- Forget
- Phish
- Leak in breaches
- Brute force

## How it works

### Registration

```
1. You provide your email
2. Your authenticator creates a key pair
3. Public key is stored by Caution
4. Private key never leaves your device
```

### Authentication

```
1. Caution sends a challenge
2. Your authenticator signs the challenge
3. Caution verifies the signature
4. Session is created
```

## Supported authenticators

### Hardware security keys

- YubiKey 5 series
- Feitian keys
- SoloKeys
- Any FIDO2-certified key

### Platform authenticators

- Touch ID (macOS)
- Windows Hello
- Android biometrics

## Security benefits

### Phishing resistant

Authenticators verify the origin (domain) of requests. Even if you visit a fake site, your authenticator won't respond to challenges from the wrong domain.

### No shared secrets

Traditional passwords are shared secrets—both you and the server know them. Passkeys use asymmetric cryptography: Caution only has your public key.

### Hardware-bound

Private keys are generated and stored in secure hardware (TPM, Secure Enclave, security key). They cannot be exported or copied.

## Sessions

After authentication, you receive a session that:

- Is stored locally in `~/.config/api-cli/config.json`
- Expires after a configured period
- Can be invalidated server-side

## Best practices

1. **Use a hardware security key** for strongest security
2. **Register multiple authenticators** for backup access
3. **Keep your security key safe** - it's your only way in

## Learn more

- [caution register](../cli/register.md) - Create an account
- [caution login](../cli/login.md) - Authenticate
- [WebAuthn specification](https://www.w3.org/TR/webauthn-2/)
