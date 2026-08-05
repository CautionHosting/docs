---
icon: lucide/key-round
---

# Key Services

<p class="docs-home-intro">Learn how Caution manages secrets inside enclaves using Shamir secret sharing, quorum-based recovery, and attested key delivery.</p>

## Overview

Caution's secret management system for enclaves offers services for managing keys that are never exposed outside of enclave memory and are portable. It solves a fundamental problem in confidential computing: how do you get secrets into an enclave without exposing them to the host or any single party?

The system uses [Shamir secret sharing](https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing) to split a master secret into multiple shards encrypted to PGP keys. A configurable quorum threshold of shard-holders must independently send their shards to the enclave before it can reconstruct the secret and derive cryptographic keys.

At a high level, Keymaker prepares the quorum materials, and Locksmith unlocks them inside the enclave after enough shard-holders approve the deployment:

```mermaid
flowchart TB
    subgraph Setup["Setup time"]
        direction LR
        Keyring["Shard-holder<br/>OpenPGP keys"]
        Keymaker["Keymaker"]
        Bundle["Quorum bundle<br/>shards, keyring, public key"]
        Recipient["Encryption<br/>public key"]

        Keyring --> Keymaker
        Keymaker --> Bundle
        Bundle --> Recipient
    end

    subgraph Repository["Application repository"]
        direction LR
        BundleFile[".caution/quorum-bundle.json"]
        SecretFiles["Encrypted secrets<br/>.caution/secrets"]
    end

    subgraph Enclave["Runtime enclave"]
        direction LR
        Locksmithd["locksmithd<br/>port 49504"]
        Keyforkd["keyforkd"]
        Oneshot["locksmith-oneshot"]
        App["Application process"]

        Locksmithd --> Keyforkd
        Keyforkd --> Oneshot
        Oneshot --> App
    end

    Holders["Shard holders"] -->|send signed shards<br/>after attestation| Locksmithd
    Bundle --> BundleFile
    Recipient --> SecretFiles
    BundleFile --> Locksmithd
    SecretFiles --> Oneshot
```

### Encrypted and public environment variables

Use Locksmith for values that must remain secret, such as database URLs, API keys, and signing keys. The Caution CLI encrypts these values from a local `.env` file into `.asc` files, which are committed with the app and decrypted inside the enclave after the quorum is met. See [Add encrypted secrets](#2-add-encrypted-secrets) for the setup flow.

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

The bundle is saved to `.caution/quorum-bundle.json` and optionally backed up to your Caution account. Commit this file to your application repository so Caution can include it in the deployed image.

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

Each shard-holder certificate must carry **signing**, **encryption**, and **authentication** keys: Locksmith encrypts the holder's shard to the encryption key and verifies shard submissions with the signing key. `caution secret new` rejects keyrings whose certificates are missing any of these with `keyring contains no Keymaker-eligible public certificates`.

=== "Development and demos"

    For development, demos, short-lived test environments, or other cases where you knowingly accept plaintext private key risk, use the CLI helper. It creates Keymaker-compatible public and private OpenPGP keyring files and requires an explicit unsafe acknowledgement:

    ```bash
    caution secret keygen alice.asc --name "Alice" --email alice@example.com --shoot-self-in-foot
    ```

    This writes `alice.asc` for Keymaker and `alice.private.asc` for Alice's later shard submission. `--shoot-self-in-foot` intentionally bypasses hardware-backed or passphrase-protected private-key handling: the private keyring is unencrypted, and anyone who can read it can submit that holder's shard. Treat `*.private.asc` files as temporary local secrets --- do not commit them, share them, or use them for production shard holders.

    Repeat key generation for each shard holder, then combine the public keys into one keyring:

    ```bash
    caution secret keygen bob.asc --name "Bob" --email bob@example.com --shoot-self-in-foot
    cat alice.asc bob.asc > keyring.asc
    ```

    For a solo test environment, one key is enough --- skip the `cat` and pass `alice.asc` directly to `caution secret new`.

=== "Production (smart card / YubiKey)"

    For production shard holders, keep private keys on OpenPGP smart cards such as YubiKeys. [Keyfork](https://git.distrust.co/public/keyfork) supports offline OpenPGP key derivation and smart-card-oriented workflows.

    Export each shard-holder's public key into the same ASCII-armored keyring file:

    ```bash
    gpg --export --armor alice@example.com > keyring.asc
    gpg --export --armor bob@example.com >> keyring.asc
    gpg --export --armor carol@example.com >> keyring.asc
    gpg --export --armor dave@example.com >> keyring.asc
    ```

    Use `>` only for the first key because it creates or replaces the file. Use `>>` for each additional key so the exported public key is appended to the existing `keyring.asc`.

The CLI merges all armored blocks into a single keyring before uploading it to Keymaker, so both assembly styles produce equivalent bundles.

#### Generate the quorum

Set `KEYMAKER_URL` to your deployed Locksmith application URL, then pick `--threshold` and `--max` for your use case:

```bash
export KEYMAKER_URL=https://your-locksmith-deployment.example

# Solo development: one holder unlocks alone
caution secret new alice.asc --threshold 1 --max 1

# Team demo: both holders must approve
caution secret new keyring.asc --threshold 2 --max 2

# Production: any 2 of the 4 shard-holders can unlock the enclave
caution secret new keyring.asc --threshold 2 --max 4 --name "production secrets"
```

`--max` must match the number of certificates in the keyring. If `KEYMAKER_URL` is unset, the CLI exits with `KEYMAKER_URL environment variable is required`.

### 2. Add encrypted secrets

Encrypt values from a shell-compatible `.env` file to the quorum's public key and place the encrypted `.asc` files in your repository.

Create a `.env` file with the values that should only be decrypted inside the enclave:

```bash
DATABASE_URL=postgres://user:password@db.example.com/app
API_KEY=secret-api-token
```

Then run:

```bash
caution secret encrypt
```

By default, `caution secret encrypt`:

- Reads `.env`
- Reads the quorum recipient public key from `.caution/quorum-bundle.json`
- Writes one armored OpenPGP message per non-empty value to `.caution/secrets/<KEY>.asc`

To encrypt only selected keys, pass them as positional arguments:

```bash
caution secret encrypt DATABASE_URL API_KEY
```

To use non-default paths:

```bash
caution secret encrypt \
  --env-file ./prod.env \
  --bundle ./.caution/quorum-bundle.json \
  --secrets-dir ./.caution/secrets
```

```text
.caution/
  quorum-bundle.json     # quorum bundle (created by caution secret new)
  secrets/
    DATABASE_URL.asc     # encrypted secret
    API_KEY.asc          # encrypted secret
```

Each `.asc` file contains a single value encrypted with the quorum's public key. The filename (minus `.asc`) becomes the environment variable name.

Commit the generated `.caution/` files that Caution needs for deployment and runtime, including `.caution/deployment.json`, `.caution/quorum-bundle.json`, and encrypted `.caution/secrets/*.asc` files. Do not commit local plaintext inputs such as `.env` or generated private keyrings such as `alice.private.asc`.

### 3. Reference secrets in your caution.hcl

Reference each encrypted secret with `env::vault(...)` in the unit's `env` map. Using `env::vault` anywhere automatically enables Locksmith — there is no separate flag. This example uses port `3000` only as a placeholder:

```hcl
enclave "main" {
  network {
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 3000
    }
  }
  unit "default" {
    command = "/app/server"
    args    = ["--port", "3000"]
    env = {
      DATABASE_URL = env::vault("DATABASE_URL")
    }
  }
}
```

Each `env::vault("NAME")` resolves to the secret decrypted from `.caution/secrets/NAME.asc`. Do not list port `49504` or any port in the reserved `49500`-`49600` range; Caution opens the Locksmith shard receiver automatically when secrets are used.

### 4. Include the bundle and secrets in your image

`locksmithd` reads the quorum bundle from `/etc/caution/bundle.json` at startup. The bundle and encrypted secrets are not injected automatically — add them to your `Containerfile`:

```dockerfile
ADD .caution/quorum-bundle.json /etc/caution/bundle.json
ADD .caution/secrets/ /etc/caution/secrets/
```

Both are safe to commit: the bundle contains only public key material and encrypted shards, and the `.asc` secrets are encrypted to the enclave-only key.

### 5. Deploy

```bash
git push caution main
```

The enclave will start with locksmithd listening on reserved port 49504, waiting for shards.

### 6. Verify and save trusted PCR values

Before sending shards, each shard-holder must establish which enclave image they trust. The CLI refuses to send shards to an enclave whose PCR values don't match stored trusted hashes — this prevents shards from being sent to a tampered or unexpected image.

Run `caution verify --save-pcrs` from your application directory to fetch the live PCR values from the running enclave, verify them against a locally reproduced build, and save them to `.caution/trusted_hashes.json`:

```bash
caution verify --save-pcrs
```

This writes `.caution/trusted_hashes.json`. Commit it so all shard-holders share the same trusted baseline. Subsequent deploys require re-running this command to update the stored values before sending shards.

!!! note "Local QEMU development"
    QEMU enclaves report all-zero PCR values. `caution verify --save-pcrs` detects this and refuses to save, because attestation cannot be verified in debug mode. Instead, create `.caution/trusted_hashes.json` manually:

    ```json
    {
      "pcr0": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "pcr1": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "pcr2": "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "verified_at": "1970-01-01T00:00:00+00:00"
    }
    ```

    This is safe to commit in development repositories. Never use it for production deployments.

### 7. Send shards

Each shard-holder sends their shard to the running enclave:

!!! warning "Temporary CLI build requirement"
    `caution secret send-shard` requires the host-toolchain CLI build. This is
    the default `make install-cli` (also available explicitly as
    `make install-cli-host`), so the standard install already supports shard
    sending.

    The host-toolchain binary is not built through StageX's reproducible,
    full-source-bootstrapped build pipeline. These are distinct properties:
    reproducibility provides bit-for-bit identical outputs that can be
    independently verified, while full-source bootstrapping provides an
    auditable build chain without opaque bootstrap binaries. Because the host
    build uses the local toolchain and links against host system libraries,
    neither property is guaranteed. It also inherits supply-chain risks from
    the local compiler, package manager, libc, PC/SC stack, and other host
    dependencies. Those risks do not apply in the same way to the StageX-built
    CLI. The explicit StageX build (`make install-cli-stagex`) works for other
    CLI commands, but the shard-sending path can hit a musl static-linking
    limitation when the PC/SC stack tries to load `libpcsclite_real.so.1`.

=== "Development and demos"

    Pass the private keyring written by `caution secret keygen`:

    ```bash
    caution secret send-shard --keyring alice.private.asc
    ```

    Each holder sends with their own private keyring. For a 2-of-2 demo quorum, run it once per holder:

    ```bash
    caution secret send-shard --keyring alice.private.asc
    caution secret send-shard --keyring bob.private.asc
    ```

=== "Production (smart card / YubiKey)"

    Insert the smart card and run:

    ```bash
    caution secret send-shard
    ```

    The CLI finds the connected card matching a certificate in the bundle's keyring and prompts for the card PIN to sign the shard submission.

For each shard-holder, the unlock flow looks like this:

```mermaid
sequenceDiagram
    participant Holder as Shard-holder CLI
    participant Locksmithd as locksmithd inside enclave
    participant NSM as Nitro Security Module
    participant Keyforkd as keyforkd
    participant Oneshot as locksmith-oneshot
    participant App as Application

    Holder->>Locksmithd: Connect on port 49504
    Holder->>Locksmithd: Request attestation
    Locksmithd->>NSM: Generate attestation document
    NSM-->>Locksmithd: Signed Nitro attestation
    Locksmithd-->>Holder: Attestation and ephemeral key
    Holder->>Holder: Verify attestation before sending
    Holder->>Locksmithd: Send signed, encrypted shard
    Locksmithd->>Locksmithd: Verify sender and count quorum

    alt Quorum reached
        Locksmithd->>Locksmithd: Reconstruct master secret
        Locksmithd->>Keyforkd: Start key derivation service
        Oneshot->>Keyforkd: Derive OpenPGP key
        Oneshot->>Oneshot: Decrypt .asc secrets
        Oneshot-->>App: Export environment variables
    else Quorum not reached
        Locksmithd-->>Holder: Wait for more valid shards
    end
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

For multi-stage builds, make sure `/etc/environment` exists in the final runtime stage. Files written in an earlier build stage are not present in the final image unless you copy them:

```dockerfile
FROM stagex/pallet-rust AS build
# Build your application and prepare public runtime configuration.
RUN printf '%s\n' \
  'APP_PORT=3000' \
  'LOG_LEVEL=info' \
  > /tmp/environment

FROM stagex/core-filesystem AS run
COPY --from=build /tmp/environment /etc/environment
COPY --from=build /myapp /app/myapp
ENTRYPOINT ["/app/myapp"]
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

- :lucide-file-code: **caution.hcl**

    ---

    Configure how your application [runs and verifies](../reference/caution-hcl.md).

</div>
