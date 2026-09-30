---
icon: lucide/key-round
---

# Key Services

<p class="docs-home-intro">Learn how Caution manages secrets inside enclaves using Shamir secret sharing, quorum-based recovery, and attested key delivery.</p>

## Choose a setup path

All three paths create a quorum bundle with a Keymaker generation proof and use
the same encryption, deployment and holder-approval flow. Choose who operates
Keymaker and how holders keep their recovery keys:

| Path | Bundle creation | Approval method | Key services you operate |
| --- | --- | --- | --- |
| [Dashboard](#dashboard) | Secrets → Create quorum bundle | Registered PGP, passkeys, imported PGP or mixed | None |
| [Managed CLI](#managed-cli) | `caution secret init` through Platform | Registered PGP, passkeys, imported PGP or mixed | None |
| [Self-hosted/manual](#self-hostedmanual) | CLI calls your Keymaker directly | External PGP | Your Keymaker |

See [Public component checks](#public-component-checks) for configured service
URLs, readiness and attestation-policy status on your Platform instance.

The dashboard creates and stores the bundle; it does not encrypt your application
values or deploy your application. Those steps use the CLI for every path.
Hosted PGP-only generation uses Caution's Keymaker, but those holders do not use
the certificate service or recryptor. Passkey holders use Caution Enclave-held keys.

New bundles use the V1 format. Existing unversioned V0 PGP bundles need a
[one-time import](#importing-v0-pgp-bundles), which preserves their quorum key
and encrypted secrets without generating a new quorum.

## Overview

Keymaker generates fresh random quorum key material, splits it into encrypted
shares and returns a proofed bundle with a public key for encrypting application
secrets. This does **not** generate your database passwords or API tokens: you
supply those values locally to `caution secret encrypt`.

An external-PGP holder keeps their own private key, preferably on a smartcard.
For a passkey holder, a PGP key is derived inside Caution's key-service enclave; their
registered passkey authorizes release of their share to the verified application.
A configurable quorum of distinct holders must contribute before the application
enclave can reconstruct the key material and decrypt its secrets.

<pre><code class="language-mermaid">flowchart TB
    UI["Dashboard or managed CLI"] --&gt; Platform["Platform"]
    PGP["External PGP public keys"] --&gt; Platform
    Platform --&gt;|"Passkey holders only"| Certificates["Certificate service"]
    Certificates --&gt;|"Certified public keys and proof"| Platform
    Platform --&gt; Hosted["Hosted Keymaker"]
    Manual["Manual CLI and PGP public keys"] --&gt; Own["User-operated Keymaker"]
    Hosted --&gt; Bundle["Proofed quorum bundle"]
    Own --&gt; Bundle
    Bundle --&gt; Encrypt["Local CLI encrypts application values"]
    Encrypt --&gt; Image["App image: bundle, policy, ciphertext"]
    Image --&gt; App["Application enclave: Locksmith"]
    PGPHolder["PGP holder: private key or smartcard"] --&gt;|"Verified destination; signed share"| App
    Passkey["Passkey holder approval"] --&gt; Recryptor["Recryptor"]
    Recryptor --&gt;|"Verified destination; re-encrypted share"| App
    subgraph Custody["Caution key-service enclave; shared key service root key"]
        Certificates
        Recryptor
    end
    App --&gt;|"Quorum reached"| Run["Decrypt secrets and start application"]
</code></pre>

Caution operates hosted Keymaker and the key-service enclave for the managed paths.
Application owners select holders, obtain independently verified policies,
encrypt/package their values and verify deployments. Holders authorize recovery;
creating a bundle does not collect their recovery approvals.

### Encrypted and public environment variables

Use Locksmith for values that must remain secret, such as database URLs, API keys, and signing keys. The Caution CLI encrypts these values from a local `.env` file into `.asc` files, which are committed with the app and decrypted inside the enclave after the quorum is met. See [Add encrypted secrets](#2-add-encrypted-secrets) for the setup flow.

For public or non-sensitive configuration, such as ports, feature flags, or public URLs, use `/etc/environment` in your container image instead. Public environment variables do not require Keymaker, a quorum bundle, Locksmith, or shard submission. Because Caution does not pass Docker build arguments, public build-time values must also be expressed in the Containerfile or files copied into the image. See [Non-encrypted environment variables](#non-encrypted-environment-variables) for the Dockerfile example.

## Components

### Keymaker

Keymaker is used only when creating a new quorum. It returns encrypted shares,
holder public certificates/credential bindings, an encryption public key and an
attestation proof. The requester verifies the proof against an independently
established Keymaker PCR policy before accepting the bundle.

Hosted and user-operated Keymakers use the same generation protocol. In the
default production build, accepting a valid generation request schedules an
**enclave reboot after a ten-second deadline**, including when generation later
fails. Subsequent requests must wait for a fresh enclave lifecycle; the generating
enclave's in-memory state is not retained for later recoveries.

The Keymaker deployment explicitly enables automatic replacement:

```hcl
restart {
  policy        = "always"
  delay_seconds = 0
}
```

Platform supervises the Nitro management process and launches a fresh enclave
after selfnuke. The zero delay removes only the host restart delay, not
Keymaker's ten-second deadline or boot time. See [Enclave restart policy](../reference/caution-hcl.md#restart-enclave-restart-policy).

Validate repeated generation, selfnuke, replacement, and endpoint connectivity on
the deployed host before relying on availability. Application owners do not manage
the hosted Keymaker's restart. Restart supervision does not prove secret erasure or resolve
failures of the in-enclave selfnuke operation.

Encryption updates, share release and recovery of an existing bundle never call
Keymaker. If generation times out or the response is lost, the outcome may be
unknown: check the dashboard's bundle list or the CLI's saved local bundle before
another explicit attempt. Do not retry generation automatically.

### Certificate service

For passkey-backed holders, Platform requests public PGP certificates derived
inside the key-service enclave. Certificates are bound to the organization, bundle
and certified holder index. Platform verifies the certificates and their proof,
and snapshots the selected registered passkeys into the bundle before asking
Keymaker to encrypt the shares. Multiple passkeys for one holder remain one share.

The corresponding derived private key is used only inside the key-service enclave;
it is not downloaded by the holder or exposed to Platform. Certificate issuance
uses a backend-only bearer token over HTTPS. This token grants issuance admission,
**not permission to release a share**; users do not provision it in their apps.

### Recryptor

At recovery time, the recryptor verifies the bundle and certified holder context,
the destination's attestation and the holder's passkey authorization. It derives
the holder's PGP key inside the enclave, decrypts that holder's share and
re-encrypts it to the verified application enclave. The holder's private key is
never released. One authorized release contributes one share, not the entire
application quorum. External-PGP holders submit directly without this service.

The certificate service and recryptor currently run in the same key-service enclave,
using the same externally recoverable root. An enclave restart loses the active
in-memory key-service state and requires operator recovery of the **existing root
bundle** before serving again. Recovering that root permits deriving the same
holder keys; operators must preserve it rather than generate a replacement root.
Named root custodians, rotation ceremonies and organizational recovery drills are
outside this application-owner guide.

### Three trust policies

| Policy | What it authorizes | Where the application owner or holder uses it |
| --- | --- | --- |
| Keymaker generation policy | The image allowed to generate a V1 bundle | `.caution/keymaker-pcr-policy.json` or `KEYMAKER_PCR_POLICY_PATH`; include the policy in the app image for V1 |
| Application measurements | The destination image allowed to receive shares | `.caution/trusted_hashes.json`, established with `caution verify` |
| Recryptor live policy | The key-service image allowed to handle passkey-backed release | `--recryptor-pcr-policy` for passkey holders |

These policies are not interchangeable. Obtain measurements independently from
reviewed builds/operator records, never by accepting values from the endpoint
being checked. Caution separately configures Platform's certificate-service
verification policy and public CA. Endpoints remain operator-configured; the
bundle does not automatically supply a trusted recryptor endpoint or policy.

ImportedV0 has no generation proof: its CLI and runtime do not use a Keymaker
policy. Application verification still applies; ImportedV0 supports external PGP
holders only. See the [import instructions](#importing-v0-pgp-bundles).

### Public component checks

Use these endpoints on the intended Platform instance to check its configured
Keymaker and, when using passkey holders, its key service. This applies to both
operator-hosted and Caution-hosted deployments. Replace the example URLs with
your Platform endpoint:

| Endpoint | Purpose |
| --- | --- |
| `https://platform.example.com/components` | Public page showing service URLs, readiness, authenticated PCRs and configured policy matches |
| `https://platform.example.com/.well-known/caution/build-inputs` | The same service observations under `services`, alongside framework build pins |

No login is required. Replace the Platform URL to inspect the JSON:

```sh
PLATFORM_URL=https://platform.example.com
curl --fail --silent --show-error \
  "$PLATFORM_URL/.well-known/caution/build-inputs" | jq '.services'
```

Check `checked_at` and each entry's `url`, `readiness`, `attestation`, `measurements`
and `policies`. Readiness, attestation and each policy result should report
`status: "passed"` for the services you intend to use. Key-service issuance and
share-release policy results are separate. Results are cached; check `checked_at`
after a service change.
A CLI `--keymaker-url` override may point elsewhere; verify that service separately.

**Check attestation** opens the browser verifier for fresh evidence. Supply
independently verified PCRs to check the expected image; browser verification
does not reproduce source or establish trust in Platform's configured policy.

Repository and commit are **service-reported**, even when attestation matches.
These observations describe the operator's configuration, not independently
established client trust. Review source and reproduce measurements with the CLI:

```sh
export CAUTION_BACKEND_URL=https://platform.example.com
caution verify --service keymaker
caution verify --service key-service
```

With `CAUTION_BACKEND_URL` exported, `--url` is optional. An explicit `--url`
overrides the environment variable for that command. Replace the placeholder URL
with your Platform endpoint.

The CLI discovers each endpoint, displays its unsigned source manifest,
and asks before building the pinned source. It independently reproduces PCR0/1/2,
checks fresh attestation and applicable TLS binding, then asks before saving trust.
Review the intended repository, revision and build inputs; matching measurements
alone do not establish that code is safe. Platform's published PCRs are not imported
as trusted measurements.

Trust is shared across projects on the same Platform, under the CLI configuration
directory's `services/` folder. Service verification leaves the app's
`.caution/trusted_hashes.json` untouched. Later operations reuse the saved endpoint
and pins. To approve a service upgrade or changed endpoint, rerun the corresponding
`verify --service` command; previous trust is backed up and mismatches never silently
update it. Use `--no-cache` to force build reproduction.

Approving a new Keymaker image retains previously verified PCR sets. The outgoing
set accepts bundle proofs generated before the local approval time; existing
historical cutoffs are preserved. Re-approving a retired image removes its cutoff,
including acceptance of proofs generated during retirement. Key-service live trust
keeps one current, non-expiring set.

Explicit flags/environment settings and project policies take precedence over
shared trust and are not rewritten. Invalid explicit configuration fails directly.
Keep historical `.caution/keymaker-pcr-policy.json` files with their bundles and
provision them on fresh machines and CI; verifying today's image cannot recover
missing history. Noninteractive commands need existing trust or explicit verified
configuration.

Client trust setup does not configure operator policies, deploy services, install
a CA on Platform, or rewrite policies packaged in enclaves. Ordinary
`caution verify --attestation-url ...` writes the current checkout's application
measurements, so run that manual form from the service's own checkout.

### Keymaker upgrades and Key Service trust

Operators must update the Key Service's generation policy when approving new
Keymaker measurements. The deployment example uses `.caution/keymaker-pcr-policy.json`,
packaged at `/etc/caution/keymaker-pcr-policy.json`, for both root recovery and
application-bundle verification. The release configuration's `keymaker_policy_path`
must point to that same file. Retain the verified sets and generation cutoffs
needed by the existing root and application bundles.

After updating the policy, rebuild/redeploy the Key Service, verify its changed
measurements, recover its **existing root** with the external-PGP holders, and
refresh Platform/gateway and holder clients' Key Service trust. Preserve the root
bundle, public CA and encrypted issuance token.

Updating client trust or Platform's Keymaker policy does not update the policy
loaded by the running Key Service. Missing generation measurements cause rejection
before passkey approval. Updating only the CLI or an application receiver does
not itself require a Keymaker policy change.

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

Choose one path below. If you already have a bundle, skip generation and continue
at [Add encrypted secrets](#2-add-encrypted-secrets). Raw V0 bundles first need
[import](#importing-v0-pgp-bundles).

#### Dashboard

1. Register the intended holders' public PGP keys or passkeys in the organization.
2. Open **Secrets → Create quorum bundle**. Select members and explicitly choose
   an approval method when both methods are available. Select an exact PGP key when several
   are registered. Optionally use **Add PGP holder** for external holders, one
   public certificate per addition; private keys are rejected.
3. Choose a **Quorum threshold** between one and the selected holder count.
   The dashboard defaults to two, allows up to ten holders total and never lowers
   the threshold silently when a holder is removed.
4. Review and authorize creation with your requester passkey. This authorizes
   creation, not release on behalf of the selected holders.
5. Download the complete JSON from **Use this bundle**, save it as
   `.caution/quorum-bundle.json` in the initialized application checkout and obtain
   the independently verified Keymaker policy, or establish shared trust with
   `caution verify --service keymaker`. Continue at
   [Add encrypted secrets](#2-add-encrypted-secrets).

#### Managed CLI

Use a current CLI and authenticate to the intended organization. Alice must have
an eligible registered PGP key and Bob a registered passkey for this example:

```sh
caution login
env -u KEYMAKER_URL caution secret init \
  --holder alice=external-pgp --holder bob=webauthn --threshold 2 \
  --name "Application secrets"
```

Run from the initialized application checkout. With no direct Keymaker override,
the CLI uses Platform's configured hosted services. It saves the proofed bundle
and accepted policy under `.caution/` and stores the bundle in your organization.
Review the displayed holders, approval methods and threshold before authorizing creation.
If Alice has several PGP keys, select one explicitly with
`--pgp-key alice=FULL_REGISTERED_PGP_FINGERPRINT`.

To combine a local public PGP keyring with organization holders:

```sh
env -u KEYMAKER_URL caution secret init external-holders.asc \
  --holder bob=webauthn --threshold 2
```

Use a public-only keyring; each certificate adds a holder. Set the threshold
explicitly; the CLI's default is one, unlike the dashboard's default of two.
`--max`, if supplied, must equal the combined holder count. The ten-holder cap is
dashboard-only. Managed PGP-only creation is also supported: select only
`external-pgp` holders and/or local public certificates.

When no Keymaker policy is configured, hosted creation offers the service
verification flow above. Use `--keymaker-pcr-policy` to supply an independently
verified policy explicitly. The precedence is that flag, `KEYMAKER_PCR_POLICY_PATH`,
the project's `.caution/keymaker-pcr-policy.json`, then shared Platform trust.
Passkey release offers key-service setup separately, before starting its recovery
session. Creation does not collect holders' release approvals.

#### Self-hosted/manual

You deploy Keymaker and holders keep external PGP keys. This path creates proofed
V1 bundles. No certificate service or recryptor is required.

Use a **separate checkout/application** for Keymaker so its deployment metadata
does not overwrite your application checkout:

```sh
git clone https://codeberg.org/caution/locksmith
cd locksmith
caution init
git push caution HEAD:main
caution verify
```

After successful verification, use the **Keymaker checkout's**
`.caution/trusted_hashes.json` directly as `--keymaker-pcr-policy`. Its flat
`pcr0`/`pcr1`/`pcr2` fields become one non-expiring set; `verified_at`
and `tls` are metadata and do not establish trust or expiry. The CLI saves the
normalized `sets` policy as `.caution/keymaker-pcr-policy.json` beside the new bundle.

This shorthand requires an updated Caution CLI. Package its saved policy for
services/runtimes, which continue to consume `sets` without a Locksmith upgrade.
Use `sets` for multiple approved images or per-set attestation-time cutoffs:

```json
{"sets":[{"pcrs":{"0":"<96 hexadecimal characters>","1":"<96 hexadecimal characters>","2":"<96 hexadecimal characters>"},"expires_at_unix_seconds":null}]}
```

Replace all placeholders with verified non-debug PCR0/1/2 values; add one set per
approved image. Do not mix flat PCR fields with `sets` or expiry fields. Neither
format establishes trust: do not copy untrusted live values or reuse stale output
after failed verification. Record the deployed Keymaker URL and policy path. Its
`/health` endpoint checks availability, not trust. The reboot lifecycle described
above also applies to this instance.

Return to your **application checkout** for the following keyring and generation
steps.

#### Create `keyring.asc`

Each shard-holder certificate must carry **signing**, **encryption**, and **authentication** keys: Locksmith encrypts the holder's shard to the encryption key and verifies shard submissions with the signing key. `caution secret init` rejects keyrings whose certificates are missing any of these with `keyring contains no Keymaker-eligible public certificates`.

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

    For a solo test environment, one key is enough --- skip the `cat` and pass `alice.asc` directly to `caution secret init`.

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

Call your own Keymaker explicitly using the public keyring prepared above:

```sh
caution secret init keyring.asc --threshold 2 --max 2 \
  --keymaker-url https://YOUR_KEYMAKER \
  --keymaker-pcr-policy /path/to/verified-keymaker-policy.json \
  --name "Application secrets" --no-upload
```

Replace the URL and policy path; `--max` must match the number of certificates.
`--no-upload` keeps creation local and avoids uploading the bundle to Platform.
Omit it to upload after authentication; the locally saved bundle remains usable
if upload fails, so do not regenerate it. Keep the completed bundle and policy.

`--keymaker-url` takes precedence over `KEYMAKER_URL`; either selects direct
PGP-only generation. Without either, the CLI uses authenticated hosted creation.
Direct mode does not support passkey holders. `caution secret new` remains an
alias for `caution secret init`.

### 2. Add encrypted secrets

Work from the initialized application checkout. Save the downloaded complete bundle
JSON as `.caution/quorum-bundle.json` (rename the downloaded file). Downloading a
bundle does not establish trust. **For V1**, encryption, inspection and shard
submission use an explicit/project Keymaker policy or existing shared trust for
the selected Platform. Establish shared trust with `caution verify --service keymaker`
if needed. These commands do not silently accept the current service's PCRs.

A deployed V1 enclave still needs its public Keymaker policy packaged in the image.
`secret init` saves `.caution/keymaker-pcr-policy.json` automatically. For a dashboard
download, obtain that policy from independently verified operator records, or
export it from the exact service-trust file printed by successful verification:

```sh
# Replace this path with the saved Keymaker trust path printed by the CLI.
jq '.policy' /path/to/saved/keymaker.json > .caution/keymaker-pcr-policy.json
caution secret inspect --bundle .caution/quorum-bundle.json
```

Do this only when the project has no existing policy; retain historical policies
for older bundles. `secret inspect` must verify the downloaded bundle against the
selected policy before you package it. Alternatively, `KEYMAKER_PCR_POLICY_PATH`
selects an explicit local policy for CLI use; ensure the matching file is also
copied into the image. Encryption and shard submission have no
`--keymaker-pcr-policy` flag.

This verifies the Keymaker proof and displays the bundle identity, authenticated
generation time, threshold, holder approval methods and certificate identifiers.
Check these match your intended quorum. It neither generates another bundle nor
unlocks an enclave. Proof verification covers the historical generation evidence;
use `caution verify` separately for the live destination before sending shares.

**For ImportedV0**, use the complete imported artifact and add `--allow-legacy`
to every encryption command below. No Keymaker policy is used by the CLI; existing
ciphertext needs no re-encryption. Follow the
[import instructions](#importing-v0-pgp-bundles) before deployment.

The dashboard's copyable example is:

```sh
caution secret encrypt DATABASE_URL --env-file /private/path/app.env
```

Replace the path with your private env file containing `DATABASE_URL`. The result
is `.caution/secrets/DATABASE_URL.asc`. Keep plaintext inputs outside Git.

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

Locksmith currently trims leading and trailing whitespace from decrypted values
when exporting them to the application environment.

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
  quorum-bundle.json     # complete V1 or ImportedV0 bundle
  keymaker-pcr-policy.json # independently verified generation policy for V1
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

`locksmithd` reads the quorum bundle from `/etc/caution/bundle.json` at startup.
Inputs are not injected automatically. For a **V1 bundle**, add the bundle,
Keymaker policy and encrypted secrets to your `Containerfile`:

```dockerfile
ADD .caution/quorum-bundle.json /etc/caution/bundle.json
ADD .caution/keymaker-pcr-policy.json /etc/caution/keymaker-pcr-policy.json
ADD .caution/secrets/ /etc/caution/secrets/
```

For V1, if the host policy was supplied through `KEYMAKER_PCR_POLICY_PATH`, also
copy that verified policy into `.caution/keymaker-pcr-policy.json` for the image build.
ImportedV0 needs only the imported bundle and ciphertext. The format-aware Platform
image preflight does not require a Keymaker policy for it; see
[importing V0 bundles](#importing-v0-pgp-bundles).

Ensure these files are readable by the enclave runtime (`0644` files, `0755`
directories), and include them in the final image stage. `env::vault` does not
copy files; use a container image rather than `build.binary` for this workflow.

These public/encrypted inputs are safe to commit: the bundle contains only public key material and encrypted shards, and the `.asc` secrets are encrypted to the enclave-only key.

### 5. Deploy

```bash
git push caution main
```

The enclave will start with locksmithd listening on reserved port 49504, waiting for shards.

### 6. Verify and save trusted PCR values

Before sending shards, each shard-holder must establish which enclave image they trust. The CLI refuses to send shards to an enclave whose PCR values don't match stored trusted hashes — this prevents shards from being sent to a tampered or unexpected image.

Run `caution verify` from your application directory to verify the live enclave against a locally reproduced build and automatically save `.caution/trusted_hashes.json`:

```bash
caution verify
```

This writes `.caution/trusted_hashes.json`. Commit it so all shard-holders share the same trusted baseline. Subsequent deploys require re-running this command to update the stored values before sending shards.

!!! note "Local QEMU development"
    QEMU and synthetic tests do not establish real Nitro attestation or live
    recovery acceptance. Do not replace a failed verification with all-zero PCRs
    or copy measurements from the endpoint into a trusted policy. Use independently
    verified non-debug measurements for this deployment and approval workflow.

### 7. Send shards

After deployment and `caution verify`, enough **distinct holders** must submit
shares to meet the bundle's quorum. For mixed approval methods, PGP and passkey holders
contribute to the same threshold; multiple passkeys belonging to one holder still
count as one share. Approval is for release to the verified application enclave,
not for bundle creation.

For V1, keep the independently verified Keymaker policy available as described in
[Add encrypted secrets](#2-add-encrypted-secrets). For ImportedV0, each external-PGP
holder must add `--allow-legacy` to `send-shard`; no Keymaker policy is used by the
CLI. Existing bundles are reused;
recovery does not call Keymaker. After an application enclave restart, holders
must submit shares again.

Each external-PGP holder uses their own private keyring or smartcard:

!!! warning "CLI build requirement"
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

    The CLI selects a matching holder/card and prompts for the required PIN/touch operations to decrypt and sign the share submission. Use `--holder CERTIFICATE_FINGERPRINT` to select a holder explicitly.

Share submission remains supported after an enclave has been waiting for days.
External-PGP signatures allow up to 60 seconds of future clock skew; a larger
skew is rejected with a clock-specific message. Check the signer and enclave
clocks if this occurs. Receiver fixes require rebuilding, redeploying and verifying
the application enclave, then resubmitting the existing quorum shares. Preserve
the bundle and encrypted secrets; updating the CLI or restarting Platform alone
does not update an already-running receiver.

#### Passkey holders

Use `caution secret inspect` to identify the holder's certificate fingerprint.
With shared trust established for the selected Platform:

```sh
caution --qr secret send-shard --holder CERTIFICATE_FINGERPRINT
# Native USB FIDO2 approval:
caution secret send-shard --holder CERTIFICATE_FINGERPRINT
```

On first use the CLI offers key-service discovery and independent verification.
It also needs a trusted Keymaker policy to check the bundle's generation proof.
These service policies are distinct from the application's trusted PCRs.

Explicit configuration remains supported:

```sh
caution secret send-shard --holder CERTIFICATE_FINGERPRINT \
  --recryptor-url https://key-service.example.com \
  --recryptor-pcr-policy /path/to/verified-recryptor-policy.json
```

`--recryptor-url` or `RECRYPTOR_URL` overrides the saved endpoint;
`--recryptor-pcr-policy` or `.caution/recryptor-pcr-policy.json` overrides shared
service trust. A different explicit endpoint requires its own verified policy.
Follow the CLI's approval flow, compare release details, and authorize with a
passkey captured in the bundle. `secret inspect` and encryption reuse existing
trust without initiating service discovery.

Your passkey authorizes release of one share. The private key stays inside the
key-service enclave. The share is re-encrypted to the verified application enclave.

Wait for the destination's acknowledgement, not just browser approval. The app
remains locked below threshold and starts with its decrypted secrets once quorum
is reached. A destination PCR mismatch requires verification of the intended app
build, not copying measurements from the failing endpoint into a trusted policy.

For an external-PGP holder, the direct unlock flow looks like this:

<pre><code class="language-mermaid">sequenceDiagram
    participant Holder as Shard-holder CLI
    participant Locksmithd as locksmithd inside enclave
    participant NSM as Nitro Security Module
    participant Keyforkd as keyforkd
    participant Oneshot as locksmith-oneshot
    participant App as Application

    Holder-&gt;&gt;Locksmithd: Connect on port 49504
    Holder-&gt;&gt;Locksmithd: Request attestation
    Locksmithd-&gt;&gt;NSM: Generate attestation document
    NSM--&gt;&gt;Locksmithd: Signed Nitro attestation
    Locksmithd--&gt;&gt;Holder: Attestation and ephemeral key
    Holder-&gt;&gt;Holder: Verify attestation before sending
    Holder-&gt;&gt;Locksmithd: Send signed, encrypted shard
    Locksmithd-&gt;&gt;Locksmithd: Verify sender and count quorum

    alt Quorum reached
        Locksmithd-&gt;&gt;Locksmithd: Reconstruct master secret
        Locksmithd-&gt;&gt;Keyforkd: Start key derivation service
        Oneshot-&gt;&gt;Keyforkd: Derive OpenPGP key
        Oneshot-&gt;&gt;Oneshot: Decrypt .asc secrets
        Oneshot--&gt;&gt;App: Export environment variables
    else Quorum not reached
        Locksmithd--&gt;&gt;Holder: Wait for more valid shards
    end
</code></pre>

This command:

1. Looks up the enclave's public IP
2. Reads the bundle from `.caution/quorum-bundle.json` (or pulls it from your Caution account)
3. Connects to the enclave on port 49504
4. Verifies the enclave's Nitro attestation
5. Encrypts and sends the shard using ECDH key exchange
6. Reports whether the quorum threshold has been met

Once enough shards are received, locksmithd reconstructs the secret, starts keyforkd, and locksmith-oneshot decrypts the secrets into environment variables. Your application then starts with full access to its secrets.

## Updating secrets and restarting

To change an application value, update your private env file, run
`caution secret encrypt` with the **existing bundle**, rebuild/redeploy the image,
verify the intended deployment and collect the required holder submissions.
For ImportedV0, add `--allow-legacy` to each encryption and release command.
A fresh application enclave must recover its quorum again; this does not require
a new bundle, new holder certificates or a Keymaker generation.

Preserve the complete bundle, its generation policy for V1, and each holder's recovery
credentials. Passkeys are captured at bundle creation: a newly registered passkey
cannot replace a captured credential or authorize release for that existing bundle.
Holder changes, root replacement and credential migration are separate operations,
not a side effect of editing a bundle's display name or labels.

| Keep with deployment inputs | Keep private |
| --- | --- |
| Complete V1 or ImportedV0 bundle, applicable public policies, verified application measurements, encrypted `.asc` values | Plaintext env files, private PGP keyrings and PINs |

Only commit the public/encrypted inputs. Do not put plaintext values into the
Containerfile or `caution.hcl`.

## Importing V0 PGP bundles

Use `caution secret import-legacy` for a one-time holder-assisted import of an
unversioned PGP bundle. Import preserves its quorum key and existing ciphertext.
To create a new quorum, use one of the three V1 creation paths above.

```sh
caution secret import-legacy --bundle /path/original-v0.json \
  --keyring /path/holder.private.asc
# For a smartcard, omit --keyring and select --holder FULL_FINGERPRINT.
caution secret inspect --bundle .caution/quorum-bundle.json
```

Import decrypts metadata only, never reconstructs the secret, and writes
`.caution/quorum-bundle.json`, refusing to overwrite an existing file.
`--output PATH` chooses another output; `--upload` signs an optional Platform
upload with explicit legacy acceptance. Keep the original. Invalid checksums or
inconsistent metadata are rejected without a repair override; restore a
consistent source from backup instead.

The tagged **ImportedV0** artifact retains the original quorum key and encrypted
shares, with the recovered threshold and ordered holder certificates. Existing
ciphertext remains valid. Its identity is a canonical content hash, with no
Keymaker generation proof, generation timestamp or bundle UUID. A signed upload
does not prove how the original key was generated; Platform validates public
structure, not encrypted metadata.

`inspect` needs neither `--allow-legacy` nor a Keymaker policy for ImportedV0. It
reports public structure, quorum and holder fingerprints with **Legacy V0 — no
Keymaker generation proof**. The dashboard has no importer, but displays uploaded
imports with the same warning, downloads and legacy-specific usage guidance.
Neither inspection nor display proves how the quorum key was generated.

Locksmith needs the imported bundle in the measured application image, retaining
the existing encrypted secrets:

```dockerfile
COPY .caution/quorum-bundle.json /etc/caution/bundle.json
COPY .caution/secrets/ /etc/caution/secrets/
```

Platform's image preflight accepts ImportedV0 without a Keymaker policy. Preflight
checks packaging, not generation provenance or imported metadata. Locksmith
validates the artifact at startup; V1 images require their independently trusted
Keymaker policy.

Rebuild and deploy the application with the imported bundle, then verify its
measurements with `caution verify` before releasing shares. The reviewed, measured
image approves the imported metadata at runtime. Import does not call Keymaker,
the certificate service or the recryptor.

```sh
# New or changed values only; existing encrypted secrets need no re-encryption.
caution secret encrypt SECRET --env-file /private/app.env --allow-legacy
# After rebuilding, deploying and verifying the application:
caution secret send-shard --holder FULL_FINGERPRINT --allow-legacy
# Add --keyring /path/holder.private.asc to release with a private-key file.
```

Each encryption/release requires `--allow-legacy`, including downloaded bundles.
Default local release lookup prefers `.caution/quorum-bundle.json` over
`.caution/secrets/bundle.json`; `--bundle PATH` selects a file explicitly.
Releasing holders recheck the encrypted metadata against the imported threshold
and ordered certificates. Fresh destination attestation, holder signatures,
distinct-holder and threshold checks, and recovered-public-key matching remain
enforced. Failed V1 parsing or proof verification never falls back to legacy
acceptance. Raw V0 must be imported before use. Import supports external-PGP
bundles only.

Expired **nonparticipating** holders do not block import, loading or threshold
recovery after restart. Actual contributions undergo signing-key and signature
checks. Expired encryption subkeys may still decrypt stored shares. With explicit
legacy acceptance, new encryption can also use the unchanged expired quorum recipient, while preserving
algorithm, certificate-binding and revocation checks. V1 encryption still
requires a live recipient.

## Non-encrypted environment variables

For configuration values that don't need encryption (ports, feature flags, public URLs), place them in `/etc/environment` in your container image. These are loaded into the enclave environment automatically, without requiring locksmith.

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

- **Quorum authorization** — the configured number of distinct holders must contribute; a threshold of one intentionally permits one holder to unlock the application.
- **Key-control boundaries** — external-PGP private keys remain with holders. Passkey-backed keys are derived inside the shared key-service enclave and require the bound holder's authorization for release.
- **Generation provenance** — V1 verifies Keymaker's generation proof. ImportedV0 has no generation proof; importing or uploading it does not establish how the quorum key was generated.
- **Enclave lifetime** — new quorum generation happens inside Keymaker; reconstruction and key derivation happen inside the application enclave. Reboots discard active in-memory state and require the appropriate recovery procedure.
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
