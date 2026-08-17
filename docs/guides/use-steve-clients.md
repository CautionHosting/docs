---
icon: lucide/shield-check
---

# Use STEVE clients

<p class="docs-home-intro">Make attested, end-to-end encrypted requests to a Caution application with the STEVE browser, CLI, or native Rust SDK.</p>

STEVE protects a request only when the client establishes the STEVE v2 protocol. In the default fail-closed configuration, an ordinary HTTPS application request is rejected with `403 {"error":"e2e_required"}` and `Cache-Control: no-store` instead of being forwarded without STEVE protection.

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

### Understand public routes

Fail-closed routing does not make bootstrap and platform endpoints secret:

- Caution serves `/.well-known/caution/health` and `/attestation` outside the application route.
- STEVE forwards `GET /` and `GET` or `HEAD` requests for `/enclave-sw.js`, `/register.js`, `/attestation-widget.js`, and `/xwing/steve_xwing_wasm_bg.wasm` as public browser bootstrap material.
- Other ordinary application requests are rejected without contacting the application. E2P endpoints remain available independently.

Browser deployments using a custom service-worker scope or different bootstrap paths need corresponding narrow routing support in the deployment. Do not enable general plaintext fallback merely to serve custom bootstrap assets.

### Migrate a legacy plaintext client

If an existing client cannot yet use STEVE, temporarily opt that deployment into legacy forwarding:

```hcl
e2e_encryption {
  mode                     = "steve"
  allow_plaintext_fallback = true
}
```

This forwards ordinary application requests without STEVE's application-layer encryption. Use it only for a bounded migration, then remove the option and redeploy. It does not change E2P behavior.

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
| Browser page API and service worker | Intercepted `fetch()` protection or explicit protected requests through the worker | Optional pinned profiles or durable browser TOFU; omission reports `not-checked` |

Prefer pinned PCRs when the client must authenticate a deployment from its first connection. The values must arrive through an independently authenticated channel. TOFU provides continuity after first use, not independently authenticated workload identity on that first connection.

## Use the browser SDK

Serve the complete STEVE JavaScript `dist/` tree from the application's origin,
then register the module service worker with a pinned policy:

```javascript
import { registerEnclaveServiceWorker } from '/register.js'

const client = await registerEnclaveServiceWorker({
  config: {
    enclaveOrigin: 'https://secure.example.com',
    expectedKeyExchange: 'XWING-DRAFT10',
    pcrPolicy: {
      mode: 'pinned',
      profiles: [{ PCR0: pcr0Hex, PCR1: pcr1Hex, PCR2: pcr2Hex }]
    }
  }
})
await client.initialize()
```

Use `client.send()` when a call must enter the protected worker path explicitly:

```javascript
const { response, sessionId } = await client.send('/api/secret', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ operation: 'read' })
})
```

The path must begin with one `/` and contain no origin, authority, or fragment.
The call supplies no implicit browser credentials or cookies. STEVE returns an
upstream `3xx` response without following it; a redirect of the outer protocol
request fails. The SDK never retries and returns the base64url ID of the session
that protected the request.

Each pinned profile requires nonzero 96-hex-character PCR0, PCR1, and PCR2
values and may contain additional PCR indices. Multiple profiles support a
reviewed rotation window; every value must match one complete profile.

For continuity after a controlled first connection, select durable browser
TOFU instead:

```javascript
pcrPolicy: { mode: 'tofu', additionalPcrIndices: [3, 8] }
```

Additional indices must be integers from 0 through 255. Duplicates and redundant
PCR0/1/2 entries canonicalize to the sorted union with mandatory PCR0/1/2. The
worker records exactly that selected set after Nitro evidence, session binding,
and key confirmation succeed. Later sessions and rotations must match the exact
stored set. `client.getStatus()` reports `attestation.pcrTrust` as `pinned`,
`tofu-enrolled`, or `tofu-matched`.

PCR policy remains optional only for browser backward compatibility. Omitting
it on first configuration reports `not-checked`; omitting it from a later
partial update retains the existing policy, and explicit `pcrPolicy: null`
clears enforcement. Resetting the active session or clearing policy does not
delete TOFU state.

Browser TOFU state is durable only while same-origin IndexedDB remains intact.
Losing the TOFU record or clearing all same-origin site data reopens enrollment.
Losing only persisted policy configuration fails closed while its durable
policy-required marker remains. An attacker able to replace the same-origin
page, worker, or configuration can also remove or alter policy before it runs;
protect initial asset and policy delivery separately.

Read or replace the configured policy through the worker:

```javascript
const current = await client.getPcrPolicy()
const { policy, status } = await client.replacePcrPolicy(nextPolicy)
```

Replacement validates and persists the configuration, resets the active
session, and returns before the new policy is attested. The next `initialize()`
or protected request enforces it. Replacement, `pcrPolicy: null`, and `reset()`
do not migrate or delete an enrolled TOFU record; re-enrollment requires an
explicit origin-controlled storage migration or clearing all site data.

`initialize()`, `rotateSession()`, and `reset()` return status; `getStatus()`
does not change session state. Client methods reject with `SteveError`, which
exposes machine-readable `code` and `stage`, a diagnostic `message`, and optional
`httpStatus`. Handle unknown future codes and do not parse `message`.

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

Use a durable store instead of `--pcrs` when continuity after a controlled first connection is sufficient. The two trust options are mutually exclusive:

```bash
./target/release/steve-cli \
  --tofu-store /secure/path/steve-pcr-trust.json \
  https://secure.example.com/health
```

The first successful session verifies the Nitro chain, nonce, selected suite, session transcript, key binder, and confirmation before atomically recording PCR0, PCR1, and PCR2. The record is scoped by origin/context and key-exchange suite. Later processes must match it. The CLI does not expose additional TOFU PCR selection and never replaces or automatically updates the record.

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

The SDK also exposes `PcrPolicy::trust_on_first_use` and
`trust_on_first_use_with_additional_pcrs`, but the application must implement
durable, atomic `PcrTrustStore::load_or_insert` storage. The exact selected PCR
set must be present, nonzero, and 48 bytes before storage is called, and it must
match on later sessions. The trust key remains bound to origin/context and
suite, not the PCR selection; changing the selection therefore requires
explicit record migration or a distinct application context. Store failures
and changed PCRs fail before application traffic. Attestation results retain
the complete signed PCR map, including unselected PCRs. The SDK has no unpinned
mode and never updates a TOFU record automatically.

For X-Wing, select the suite explicitly:

```rust
use steve_sdk::KeyExchangeSuite;

let client = Client::builder("https://secure.example.com", expected)?
    .application_context(b"payments-production")
    .expected_key_exchange(KeyExchangeSuite::XWingDraft10)
    .connect()
    .await?;
```

The default native context is bound to the normalized STEVE origin. Add a stable `application_context` when separate applications on the same origin need distinct session and TOFU trust bindings. Changing it selects a different trust record.

The native client rotates sessions before server expiry, applies bounded request deadlines, disables redirects, and never automatically retries an application request.

## See also

- [End-to-end encryption](../concepts/encryption.md)
- [Deployment configuration](../reference/deployment-configuration.md#steve-end-to-end-encryption-recommended)
- [Verify an app](verify-an-app.md)
- [STEVE source and protocol](https://git.distrust.co/public/steve){:target="_blank"}
