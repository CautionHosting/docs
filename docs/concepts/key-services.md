---
icon: lucide/key-round
---

# Key Services

Manage secrets inside enclaves using shamir secret sharing and quorum-based key recovery.

## Overview

Caution's secret management system for enclaves offers services for managing keys that are never exposed outside of enclave memory and are portable. It solves a fundamental problem in confidential computing: how do you get secrets into an enclave without exposing them to the host or any single party?

The system uses [shamir secret sharing](https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing) to split a master secret into multiple shards encrypted to PGP keys. A configurable quorum threshold of shard-holders must independently send their shards to the enclave before it can reconstruct the secret and derive cryptographic keys.

## Components

### Keymaker

Keymaker is the setup-time component. It generates the initial quorum: a master secret split into shards, each encrypted to a shard-holder's OpenPGP key.

Run it via the CLI:

```bash
caution secret new keyring.asc --threshold 2 --max 4
```

This produces a **quorum bundle** containing:

- **Shardfile** --- the shamir-split secret, each share encrypted to a shard-holder's OpenPGP key
- **Keyring** --- the public OpenPGP keyring of all shard-holders (used to verify shard submissions)
- **Public key** --- the derived public key for encrypting secrets to the enclave

The bundle is saved to `.caution/secrets/bundle.json` and optionally backed up to your Caution account.
This data should be checked in as part of the repository.

### Locksmithd

Locksmithd runs inside the enclave at startup. It:

1. Reads the quorum bundle from `/etc/caution/bundle.json`
2. Listens on port **8084** for incoming shard submissions
3. Verifies each shard is signed by a key in the bundle's keyring
4. Uses Nitro attestation to prove to shard-holders that they're sending to a genuine enclave
5. Once the quorum threshold is met, reconstructs the master secret
6. Starts **keyforkd**, a key derivation daemon that derives cryptographic keys from the master secret

### Locksmith-oneshot

After locksmithd reconstructs the secret and starts keyforkd, locksmith-oneshot runs once to:

1. Connect to keyforkd and derive an OpenPGP key
2. Decrypt all `.asc` files in `/etc/caution/secrets/`
3. Output the decrypted values as `export KEY=value` statements

The enclave startup script sources this output:

```bash
source <(/usr/bin/locksmith-oneshot)
```

This makes decrypted secrets available as environment variables to your application.

## Usage

### 1. Generate a quorum

Create an OpenPGP keyring with the public keys of all shard-holders, then generate the quorum:

```bash
caution secret new keyring.asc --threshold 2 --max 4 --name "production secrets"
```

This creates a 2-of-4 quorum: any 2 of the 4 shard-holders can unlock the enclave.

### 2. Add encrypted secrets

Encrypt your secret values to the quorum's public key and place them in your repository:

```
.caution/
  secrets/
    bundle.json          # quorum bundle (created by caution secret new)
    database_url.asc     # encrypted secret
    api_key.asc          # encrypted secret
```

Each `.asc` file should contain a single value, encrypted with the quorum's public key. The filename (minus `.asc`) becomes the environment variable name.

### 3. Enable Locksmith in your Procfile

```
run: /app/server
locksmith: true
ports: 8083
```

### 4. Deploy

```bash
git push caution main
```

The enclave will start with locksmithd listening on port 8084, waiting for shards.

### 5. Send shards

Each shard-holder sends their shard to the running enclave:

```bash
caution secret send-shard
```

This command:

1. Looks up the enclave's public IP
2. Reads the bundle from `.caution/secrets/bundle.json` (or pulls it from your Caution account)
3. Connects to the enclave on port 8084
4. Verifies the enclave's Nitro attestation
5. Encrypts and sends the shard using ECDH key exchange
6. Reports whether the quorum threshold has been met

Once enough shards are received, locksmithd reconstructs the secret, starts keyforkd, and locksmith-oneshot decrypts the secrets into environment variables. Your application then starts with full access to its secrets.

## Non-encrypted environment variables

For configuration values that don't need encryption (ports, feature flags, public URLs), place them in `/etc/environment` in your container image. These are loaded into the enclave environment automatically, without requiring locksmith.

```dockerfile
RUN echo "APP_PORT=8083" >> /etc/environment
RUN echo "LOG_LEVEL=info" >> /etc/environment
```

## Security model

- **No single point of trust** --- the master secret only exists briefly during reconstruction, inside the enclave's encrypted memory
- **Attestation-verified** --- shard-holders verify the enclave's Nitro attestation before sending, ensuring shards go only to genuine enclaves running the expected code
- **Signed shards** --- each shard submission is OpenPGP-signed, so locksmithd can verify the sender is an authorized shard-holder from the keyring
- **Ephemeral key exchange** --- shard data is encrypted using ECDH with an ephemeral key attested by the enclave, preventing interception

## See also

<div class="grid cards" markdown>

- :lucide-lock: **Encryption**

    ---

    Learn about [end-to-end encryption](encryption.md) with STEVE.

- :lucide-fingerprint: **Attestation**

    ---

    Understand [hardware-backed cryptographic proofs](attestation.md) that locksmith relies on.

- :lucide-file-code: **Procfile reference**

    ---

    Configure how your application [builds, runs, and verifies](../reference/procfile.md), including `locksmith: true`.

</div>
