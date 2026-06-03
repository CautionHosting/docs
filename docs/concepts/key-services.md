---
icon: lucide/key-round
---

# Key Services

<p class="docs-home-intro">Learn how Caution manages secrets inside enclaves using Shamir secret sharing, quorum-based recovery, and attested key delivery.</p>

## Overview

Caution's secret management system for enclaves offers services for managing keys that are never exposed outside of enclave memory and are portable. It solves a fundamental problem in confidential computing: how do you get secrets into an enclave without exposing them to the host or any single party?

The system uses [Shamir secret sharing](https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing) to split a master secret into multiple shards encrypted to PGP keys. A configurable quorum threshold of shard-holders must independently send their shards to the enclave before it can reconstruct the secret and derive cryptographic keys.

### Encrypted and public environment variables

Use Locksmith for values that must remain secret, such as database URLs, API keys, and signing keys. These values are encrypted into `.asc` files, committed with the app, and decrypted inside the enclave after the quorum is met. See [Add encrypted secrets](#2-add-encrypted-secrets) for the setup flow.

For public or non-sensitive configuration, such as ports, feature flags, or public URLs, use `/etc/environment` in your container image instead. Public environment variables do not require Keymaker, a quorum bundle, Locksmith, or shard submission. Because Caution does not pass Docker build arguments, public build-time values must also be expressed in the Containerfile or files copied into the image. See [Non-encrypted environment variables](#non-encrypted-environment-variables) for the Dockerfile example.

## Components

### Keymaker

Keymaker is the setup-time component. It generates the initial quorum: a master secret split into shards, each encrypted to a shard-holder's OpenPGP key. Deploy it from the Locksmith repository before generating a quorum:

```bash
git clone https://codeberg.org/caution/locksmith
cd locksmith
caution init
git push caution main
```

After the deployment finishes, set `KEYMAKER_URL` to the deployed Locksmith application URL before running `caution secret new`:

```bash
export KEYMAKER_URL=https://your-locksmith-deployment.example
caution secret new keyring.asc --threshold 2 --max 4
```

To check that Keymaker is reachable, request `$KEYMAKER_URL/health`; a healthy response reports `{"service":"keymaker","status":"ok"}`.

This produces a **quorum bundle** containing:

- **Shardfile** --- the Shamir-split secret, each share encrypted to a shard-holder's OpenPGP key
- **Keyring** --- the public OpenPGP keyring of all shard-holders (used to verify shard submissions)
- **Public key** --- the derived public key for encrypting secrets to the enclave

The bundle is saved to `.caution/quorum-bundle.json` and optionally backed up to your Caution account.
This data should be checked in as part of the repository.

### Locksmithd

Locksmithd runs inside the enclave at startup. It:

1. Reads the quorum bundle from `/etc/caution/bundle.json`
2. Listens on port **49504** for incoming shard submissions
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

#### Create `keyring.asc`

Export each shard-holder's public OpenPGP key into the same ASCII-armored keyring file:

```bash
gpg --export --armor alice@example.com > keyring.asc
gpg --export --armor bob@example.com >> keyring.asc
gpg --export --armor carol@example.com >> keyring.asc
gpg --export --armor dave@example.com >> keyring.asc
```

Use `>` only for the first key because it creates or replaces the file. Use `>>` for each additional key so the exported public key is appended to the existing `keyring.asc`.

Set `KEYMAKER_URL` to your deployed Locksmith application URL, then generate the quorum:

```bash
export KEYMAKER_URL=https://your-locksmith-deployment.example
caution secret new keyring.asc --threshold 2 --max 4 --name "production secrets"
```

If `KEYMAKER_URL` is unset, the CLI exits with `KEYMAKER_URL environment variable is required`.

This creates a 2-of-4 quorum: any 2 of the 4 shard-holders can unlock the enclave.

### 2. Add encrypted secrets

Encrypt values from a shell-compatible `.env` file to the quorum's public key and place the encrypted `.asc` files in your repository:

First, load the values from `.env` into your shell:

```bash
set -a
. ./.env
set +a
```

Then extract the quorum's public key from the bundle generated by `caution secret new`:

```bash
jq -r '.secret_recipient_public_key' .caution/quorum-bundle.json > recipient.asc
```

This writes the raw armored public key to `recipient.asc`. GPG needs that public key as the recipient.

Encrypt one environment variable from `.env`:

```bash
mkdir -p .caution/secrets
printf '%s' "$DATABASE_URL" \
  | gpg --batch --yes --trust-model always \
      --encrypt --armor \
      --recipient-file recipient.asc \
      --output .caution/secrets/DATABASE_URL.asc
```

```text
.caution/
  quorum-bundle.json     # quorum bundle (created by caution secret new)
  secrets/
    DATABASE_URL.asc     # encrypted secret
    API_KEY.asc          # encrypted secret
```

Each `.asc` file should contain a single value, encrypted with the quorum's public key. The filename (minus `.asc`) becomes the environment variable name.

### 3. Enable Locksmith in your Procfile

This example uses port `3000` only as a placeholder:

```yaml
run: /app/server --port 3000
locksmith: true
ports: 3000
```

List your application port in `ports`. Do not list port `49504` or any port in the reserved `49500`-`49600` range; Caution opens the Locksmith shard receiver automatically when `locksmith: true`.

### 4. Deploy

```bash
git push caution main
```

The enclave will start with locksmithd listening on reserved port 49504, waiting for shards.

### 5. Send shards

Each shard-holder sends their shard to the running enclave:

!!! warning "Temporary CLI build requirement"
    `caution secret send-shard` currently requires the host-toolchain
    untrusted CLI build. Install that binary from the platform repository with
    `make install-cli-untrusted`. The default StageX reproducible CLI build
    works for other CLI commands, but the shard-sending path can hit a musl
    static-linking limitation when the PC/SC stack tries to load
    `libpcsclite_real.so.1`.

```bash
caution secret send-shard
```

This command:

1. Looks up the enclave's public IP
2. Reads the bundle from `.caution/quorum-bundle.json` (or pulls it from your Caution account)
3. Connects to the enclave on port 49504
4. Verifies the enclave's Nitro attestation
5. Encrypts and sends the shard using ECDH key exchange
6. Reports whether the quorum threshold has been met

Once enough shards are received, locksmithd reconstructs the secret, starts keyforkd, and locksmith-oneshot decrypts the secrets into environment variables. Your application then starts with full access to its secrets.

## Non-encrypted environment variables

For configuration values that don't need encryption (ports, feature flags, public URLs), place them in `/etc/environment` in your container image. These are loaded into the enclave environment automatically, without requiring locksmith. This is also where values that older workflows might have supplied with Docker build arguments should be baked into the image.

```dockerfile
RUN echo "APP_PORT=3000" >> /etc/environment
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

- :lucide-fingerprint: **Attestations**

    ---

    Prove workload integrity with [hardware-backed cryptographic proofs](attestation.md).

- :lucide-file-code: **Procfile**

    ---

    Configure how your application [runs and verifies](../reference/procfile.md).

</div>
