---
icon: lucide/badge-check
---

# Verify an app

<p class="docs-home-intro">Use <code>caution verify</code> to prove that a deployed Caution app is running an enclave image built from source and build inputs you can inspect.</p>

## What verification proves

Caution apps are verifiable. As an end user, you can ascertain what software runs inside an enclave before deciding whether to trust it with data.

This is stronger than the common confidential compute guarantee. Many systems can attest that the software currently deployed has not changed since launch. Caution also connects that attested enclave image back to the source code and build recipe used to produce it. If the source is available, you can review the application, EnclaveOS components, startup script, and manifest, then verify that the running enclave matches that review.

Verification does not decide whether source code is safe. It gives you a cryptographic link between the code you reviewed and the enclave serving traffic.

## Before you start

You need:

- The [Caution CLI](https://codeberg.org/caution/platform/src/branch/main/src/cli){:target="_blank"} and [Docker](https://www.docker.com/){:target="_blank"} installed
- A deployed Caution app running outside debug mode
- The app's attestation endpoint, or a local Caution deployment state in the app directory
- Access to the source used to build the app, unless you are verifying against a known PCR file

!!! warning "Debug mode cannot be verified"
    AWS Nitro Enclaves zero out PCR values in debug mode. Remove `debug: true` from the `Procfile` and redeploy before verifying a production app.

## Publish source information

If you operate the app and want third parties to verify it from the remote manifest, include source locations in the `Procfile` before deploying. This example uses port `3000` only as a placeholder:

```yaml
run: /app/server --port 3000
ports: 3000
app_sources: https://codeberg.org/example/myapp
```

Caution embeds the source URL and commit in the attestation manifest. Without `app_sources`, third parties cannot independently reproduce the app from the remote manifest. For private repositories, verifiers need their own source access and should use `--app-source-url` or `--from-local`.

Deploy or redeploy the app after changing source verification settings:

```bash
git push caution main
```

## Verify from the app directory

Run the default verification flow from the deployed app's repository:

```bash
caution verify
```

The CLI infers the attestation endpoint from local Caution deployment state, requests an attestation from the enclave, reproduces the build from the remote manifest, and compares the expected PCR values with the running enclave.

## Verify a remote app

If you are verifying an app from outside its deployment directory, pass the attestation endpoint explicitly:

```bash
caution verify --attestation-url http://<host>/attestation
```

Caution serves `/attestation` through the deployment's public HTTP/HTTPS endpoint and proxies it internally to bootproofd on reserved port `49502`. Use the exact attestation URL shown by the deployment output or provided by the app operator.

## Verification modes

Choose the mode that matches the source access you have.

| Situation | Command |
|-----------|---------|
| Public source is listed in the remote manifest | `caution verify` |
| You have the attestation endpoint but no local deployment state | `caution verify --attestation-url http://<host>/attestation` |
| The manifest omits private source, but you have a Git URL | `caution verify --app-source-url git@codeberg.org:org/app.git` |
| You have the exact source checked out locally | `caution verify --from-local` |
| You already have expected PCR values | `caution verify --pcrs pcrs.txt` |
| You want to force a fresh local rebuild | `caution verify --no-cache` |

You can combine `--attestation-url` with `--app-source-url`, `--from-local`, `--pcrs`, or `--no-cache` when verifying a remote app.

## What the CLI checks

When you run `caution verify`, the CLI:

1. Generates a fresh nonce to prevent replay attacks.
2. Sends the nonce to the enclave attestation endpoint.
3. Reads remote PCR values and manifest information from the attestation response.
4. Calculates expected PCRs by reproducing the build, or reads expected PCRs from a PCR file you provide.
5. Verifies the Nitro attestation document, including the AWS Nitro certificate chain, certificate validity, COSE signature, nonce, and expected PCR values.
6. Reports whether the deployed enclave matches the expected PCRs.

The important success lines look like this:

```text
Remote PCR values (from deployed enclave):
  PCR0: ...
  PCR1: ...
  PCR2: ...

Expected PCR values:
  PCR0: ...
  PCR1: ...
  PCR2: ...

✓ PCR values match expected
✓ Attestation verification PASSED
```

If verification passes, the running enclave matches the source and build inputs used for the local reproduction.

## Inspect the reproduced build

During verification, the CLI prints a build artifacts directory. Open that directory to review what went into the reproduced enclave image:

| Path | What to inspect |
|------|-----------------|
| `Containerfile.eif` | Complete enclave image build recipe |
| `app/` | Application source and packaged files |
| `enclave/` | EnclaveOS source, including init and attestation service code |
| `run.sh` | Generated startup script |
| `manifest.json` | Build provenance, source URLs, commits, and metadata |

Reviewing these files is the step that turns attestation into practical verifiability: you can inspect capabilities in source, then prove that the deployed enclave corresponds to that source.

## If verification fails

Use the failure message to choose the next step:

| Failure | What to do |
|---------|------------|
| Debug-mode warning | Remove `debug: true` from the `Procfile`, redeploy, and verify again. |
| Missing remote manifest | Redeploy with current Caution tooling and `app_sources`, or use `--from-local` or `--pcrs`. |
| Private source unavailable | Provide a Git URL with `--app-source-url`, or verify from an authorized local checkout with `--from-local`. |
| PCR mismatch | Treat the app as unverified. Confirm the source commit, build inputs, and deployment are the ones you intended; then retry with `--no-cache`. |
| Attestation endpoint unreachable | Check the exact endpoint URL from deployment output or app operator instructions. |

## Verification and encryption

Verification proves what code is running. If the app also needs to keep request and response data hidden from the host system, enable end-to-end encryption with STEVE. Standard TLS may terminate outside the enclave, while STEVE adds an encryption layer that terminates inside the attested enclave.

See [Encryption](../concepts/encryption.md) for setup details.

## See also

<div class="grid cards" markdown>

- :lucide-fingerprint: **Attestations**

    ---

    Learn how Caution [verifies enclave integrity](../concepts/attestation.md) with hardware-backed proofs.

- :lucide-shield-check: **Verifiability**

    ---

    Learn why Caution ties [running enclaves back to source](../concepts/verifiability.md).

</div>
