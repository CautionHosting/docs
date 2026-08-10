---
icon: lucide/shield-check
---

# Use STEVE clients

<p class="docs-home-intro">Make attested, end-to-end encrypted requests to a Caution application with the STEVE CLI or native Rust SDK.</p>

STEVE protects a request only when the client establishes the STEVE v2 protocol. An ordinary HTTPS client does not verify Nitro attestation or add STEVE's application-layer encryption.

## Configure the deployment

Enable STEVE in the application's `caution.hcl`:

```hcl
network {
  ingress {
    cidr_ipv4 = "0.0.0.0/0"
    port      = 8080
  }
  http {
    domain = "secure.example.com"
    port   = 8080

    e2e_encryption {
      mode         = "steve"
      cors_origins = ["https://client.example.com"]
      key_exchange = "xwing-draft10"
    }
  }
}
```

`cors_origins` is needed for browser applications on another origin. List each exact origin; wildcard origins are rejected. Omit `key_exchange` for the default X25519 suite. X-Wing deployments must set `key_exchange = "xwing-draft10"`, and every client must independently select `XWING-DRAFT10`. STEVE does not negotiate or fall back between suites.

Deploy the application after changing the configuration:

```bash
git push caution main
```

## Establish trusted PCRs

Verify the deployed application from its repository:

```bash
caution verify
```

For a remote application, provide its attestation endpoint:

```bash
caution verify --attestation-url https://secure.example.com/attestation
```

A successful verification writes the independently reproduced PCR0, PCR1, and PCR2 values to `.caution/trusted_hashes.json`. Existing trusted state is backed up before replacement.

The file establishes which workload a pinned client accepts. Review and distribute it through an authenticated channel. Do not bootstrap expected PCRs from the same untrusted endpoint response without reproducing and verifying the deployment.

The native SDK and CLI require all three PCRs to be 48 bytes and nonzero. Debug-mode, all-zero PCRs are rejected.

## Choose a client

| Client | Use case | PCR policy |
|--------|----------|------------|
| STEVE CLI | One request, scripting, and diagnostics | One or more pinned profiles, or durable TOFU |
| Native Rust SDK | Application integration | One or more pinned profiles, or application-owned durable TOFU |
| Browser page API and service worker | Page-side registration with worker-owned `fetch()` protection | Verifies Nitro session binding, but does not yet enforce independently supplied expected PCRs |

Prefer pinned PCRs when the client must authenticate a deployment from its first connection. TOFU provides continuity after first use, not independently authenticated workload identity on that first connection.

## Use the STEVE CLI

From a reviewed STEVE checkout containing `steve-cli`, build it with:

```bash
cargo build --release -p steve-cli
```

Make a GET request with a pinned Caution trusted-state file:

```bash
./target/release/steve-cli \
  --pcrs /path/to/.caution/trusted_hashes.json \
  https://secure.example.com/api/secret
```

With no trust option, the CLI reads `.caution/trusted_hashes.json` from the current directory. A request without a body uses GET. `--data` or `--json` uses POST:

```bash
./target/release/steve-cli \
  --pcrs /path/to/.caution/trusted_hashes.json \
  --json '{"action":"status"}' \
  https://secure.example.com/api/command
```

The response body is written to standard output. PCR trust status and diagnostics are written to standard error.

### Approve an upgrade window

Repeat `--pcrs` to approve complete current and next profiles:

```bash
./target/release/steve-cli \
  --pcrs current.json \
  --pcrs next.json \
  https://secure.example.com/health
```

PCR0, PCR1, and PCR2 must all match one profile. Values from different profiles are never combined.

### Use trust on first use

Use a durable store instead of `--pcrs` when continuity after a controlled first connection is sufficient:

```bash
./target/release/steve-cli \
  --tofu-store /secure/path/steve-pcr-trust.json \
  https://secure.example.com/health
```

The first successful session verifies the Nitro chain, nonce, selected suite, session transcript, key binder, and confirmation before atomically recording PCR0, PCR1, and PCR2. The record is scoped by origin/context and key-exchange suite. Later processes must match it. The CLI never replaces or automatically updates it.

Protect and back up the store. Deleting or replacing it reopens first-use enrollment. Use an out-of-band procedure to authorize a PCR-changing upgrade.

Validate the URL, options, and trust policy without networking or changing a TOFU store:

```bash
./target/release/steve-cli \
  --dry-run \
  --tofu-store /secure/path/steve-pcr-trust.json \
  https://secure.example.com/health
```

For an X-Wing deployment, add `--key-exchange XWING-DRAFT10`. The CLI intentionally does not follow redirects or retry requests, because an application operation may already have executed.

## Use the native Rust SDK

When consuming the SDK from Git, pin a reviewed STEVE commit rather than a floating branch:

```toml
[dependencies]
hex = "0.4"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
steve-sdk = { git = "https://git.distrust.co/public/steve", rev = "<reviewed-steve-commit>" }
tokio = { version = "1", features = ["macros", "rt-multi-thread"] }
```

Load the Caution trusted-state file, establish an attested session, and send a protected request:

```rust
use serde::Deserialize;
use steve_sdk::{Client, ExpectedPcrs};

#[derive(Deserialize)]
struct TrustedHashes {
    pcr0: String,
    pcr1: String,
    pcr2: String,
}

fn load_pcrs(path: &str) -> Result<ExpectedPcrs, Box<dyn std::error::Error>> {
    let hashes: TrustedHashes = serde_json::from_slice(&std::fs::read(path)?)?;
    Ok(ExpectedPcrs::from([
        (0, hex::decode(hashes.pcr0)?),
        (1, hex::decode(hashes.pcr1)?),
        (2, hex::decode(hashes.pcr2)?),
    ]))
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let expected = load_pcrs(".caution/trusted_hashes.json")?;
    let client = Client::new("https://secure.example.com", expected).await?;
    let attestation = client.verify_attestation().await?;
    eprintln!("PCR trust: {:?}", attestation.pcr_trust);

    let response = client.get("/api/secret").send().await?;
    println!("{}", response.text()?);
    Ok(())
}
```

For an upgrade window, construct `PcrPolicy::pinned([current, next])` and connect with `Client::new_with_policy`. Each profile must contain nonzero 48-byte PCR0, PCR1, and PCR2 values.

The SDK also exposes `PcrPolicy::trust_on_first_use`, but the application must implement durable, atomic `PcrTrustStore::load_or_insert` storage. Store failures and changed PCRs fail before application traffic. The SDK has no unpinned mode and never updates a TOFU record automatically.

For X-Wing, select the suite explicitly:

```rust
use steve_sdk::KeyExchangeSuite;

let client = Client::builder("https://secure.example.com", expected)?
    .expected_key_exchange(KeyExchangeSuite::XWingDraft10)
    .connect()
    .await?;
```

The native client rotates sessions before server expiry, applies bounded request deadlines, disables redirects, and never automatically retries an application request.

## See also

- [End-to-end encryption](../concepts/encryption.md)
- [Deployment configuration](../reference/deployment-configuration.md#steve-end-to-end-encryption-recommended)
- [Verify an app](verify-an-app.md)
- [STEVE source and protocol](https://git.distrust.co/public/steve){:target="_blank"}
