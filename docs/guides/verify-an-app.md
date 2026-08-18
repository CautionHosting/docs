---
icon: lucide/badge-check
---

# Verify an app

<p class="docs-home-intro">Use <code>caution verify</code> to prove that a deployed Caution app is running an enclave image built from source and build inputs you can inspect.</p>

## What verification proves

Caution apps are verifiable. As an end user, you can ascertain what software runs inside an enclave before deciding whether to trust it with data.

This is stronger than the common confidential compute guarantee. Many systems can attest that the software currently deployed has not changed since launch. Caution also connects that attested enclave image back to the source code and build recipe used to produce it. If the source is available, you can review the application, EnclaveOS components, startup script, and manifest, then verify that the running enclave matches that review.

Verification does not decide whether source code is safe. It gives you a cryptographic link between the code you reviewed and the enclave serving traffic.

## Inspect attestation in a browser

The public `/verify` page authenticates fresh nonce-bound AWS Nitro evidence and displays its PCR0, PCR1, and PCR2 values without requiring a Caution account. Enter an HTTPS application domain or explicit HTTPS attestation endpoint. The endpoint must allow cross-origin browser POST requests. Use `caution verify --attestation-url <url>` for HTTP or raw-IP endpoints.

Browser attestation does not authenticate the sibling response manifest, reproduce source, establish a STEVE encrypted session, or automatically prove that the enclave is the expected deployment. The current browser verifier does not pin expected PCRs; compare them manually only after obtaining reviewed values through an independent trusted source. Use the CLI from a reviewed checkout for source reproduction and expected-PCR enforcement.

## Before you start

You need:

- The [Caution CLI](https://codeberg.org/caution/platform/src/branch/main/src/cli){:target="_blank"} and [Docker](https://www.docker.com/){:target="_blank"} installed
- A deployed Caution app running outside debug mode
- The app's attestation endpoint, or a local Caution deployment state in the app directory
- Access to the source used to build the app, unless you are verifying against a known PCR file

!!! note "macOS requires Docker Rosetta support"
    On Apple Silicon Macs, enable Rosetta support in Docker Desktop before running `caution verify`. Open Docker Desktop settings, enable **Use Rosetta for x86_64/amd64 emulation on Apple Silicon**, then apply the change and restart Docker if prompted.

!!! warning "Debug mode cannot be verified"
    AWS Nitro Enclaves zero out PCR values in debug mode. Remove the `debug` block from `caution.hcl` and redeploy before verifying a production app.

## Publish source information

If you operate the app and want third parties to verify it from the remote manifest, include source locations in `caution.hcl` before deploying. This example uses port `3000` only as a placeholder:

```hcl
enclave "main" {
  build {
    app_sources = ["https://codeberg.org/example/myapp"]
  }
  network {
    ingress {
      cidr_ipv4 = "0.0.0.0/0"
      port      = 3000
    }
  }
  unit "default" {
    command = "/app/server"
    args    = ["--port", "3000"]
  }
}
```

Caution includes the source URL and commit in the unsigned response manifest used to select reproduction inputs. Trust comes from verifying that the reproduced PCRs match the signed Nitro attestation. Without `app_sources`, third parties cannot independently obtain the app source. Verifiers need an authorized local checkout, source tarball, or Git URL.

Deploy or redeploy the app after changing source verification settings:

```bash
git push caution main
```

## Verify from the app directory

Run the default verification flow from the deployed app's repository:

```bash
caution verify
```

The CLI infers the attestation endpoint from local Caution deployment state. It reads the app commit from the fresh response's unsigned manifest metadata, stages that commit from the local repository, reproduces the build, and verifies the resulting PCR values. If the manifest has no app commit, it stages local `HEAD`.

Current deployments also pin the Platform framework archive to an exact commit in the response manifest. Source-backed verification uses that deployed pin. A manifestless local build such as `caution apps build` instead queries the configured Platform API's public `/.well-known/caution/build-inputs` endpoint, pins the advertised Platform commit, and includes it in the local build cache identity. That endpoint reports operator-advertised current inputs; it is not app-specific or attested. For a deployed app, rely on the manifest-backed PCR verification result rather than the endpoint alone.

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
| You have the app repository checked out locally | `caution verify` |
| You have the app repository and an explicit endpoint | `caution verify --attestation-url http://<host>/attestation` |
| You have a Git URL instead of a local checkout | `caution verify --app-source-url git@codeberg.org:org/app.git` |
| You have an exact source archive | `caution verify --from-tarball source.tar.gz` |
| You already have expected PCR values | `caution verify --pcrs pcrs.txt` |
| You want to force a fresh local rebuild | `caution verify --no-cache` |
| You only want to inspect the remote attestation | `caution verify --inspect-attestation` |

`--from-tarball`, `--app-source-url`, and `--pcrs` are mutually exclusive source selectors. `--from-local` is accepted for one release but deprecated because local source is now the default. You can combine `--attestation-url` or `--no-cache` with one source selector. Inspection accepts `--attestation-url` but conflicts with source selectors, `--no-cache`, and `--save-pcrs` because it does not perform verification.

## Inspect without verifying

```bash
caution verify --inspect-attestation --attestation-url http://<host>/attestation
```

This fetches a fresh-nonce response, parses the COSE payload, prints normalized JSON to stdout, and exits. The JSON marks verification as `not_performed`, encodes CBOR byte strings as `base64:<value>`, and places the sibling unsigned manifest under `response_metadata`. A warning is printed to stderr. No Nitro signature, PCR, source, build, TLS, or persistence check is performed, so this output is debugging evidence only.

## What the CLI checks

When you run `caution verify`, the CLI:

1. Generates a fresh nonce to prevent replay attacks.
2. Sends the nonce to the enclave attestation endpoint.
3. Parses and immediately prints the remote PCRs and `user_data` as unverified values, and labels the response manifest as unsigned metadata.
4. Stages the selected source once, reads its existing configuration, and reproduces the build, or reads expected PCRs from a PCR file you provide.
5. Verifies the Nitro attestation document, including the AWS Nitro certificate chain, certificate validity, COSE signature, nonce, and expected PCR values.
6. For the source-backed Attested TLS browser-compatibility mode, validates the verified `user_data` metadata and live certificate binding unless a raw-IP run has no DNS answer; that explicit skip is PCR-only.
7. Atomically writes `.caution/trusted_hashes.json`, preserving the previous file in a unique backup.

For a source-backed Attested TLS deployment with a completed certificate binding, the important success lines look like this:

```text
Remote PCR values (unverified until verification succeeds):
  PCR0: ...
  PCR1: ...
  PCR2: ...
Remote user data (unverified): ...

Expected PCR values:
  PCR0: ...
  PCR1: ...
  PCR2: ...

✓ Base Nitro attestation and expected PCR0/1/2 verified
✓ TLS certificate binding verified
✓ Attestation verification PASSED
Trusted state: .caution/trusted_hashes.json
```

The base-verification success line authenticates the PCRs and `user_data` displayed earlier; the CLI does not print `user_data` a second time. UTF-8 control characters are escaped, and non-UTF-8 `user_data` is shown as hexadecimal.

Successful verification also writes `.caution/trusted_hashes.json`, backing up any previous trusted state first. Native STEVE clients and the STEVE CLI can use this file as their pinned PCR policy. Distribute it through an authenticated channel when the client runs on another machine.

For the source-backed Attested TLS browser-compatibility mode (`mode = "tls"` in `caution.hcl`), an HTTPS attestation request on the configured domain binds the leaf certificate from that same WebPKI-validated, non-redirected response. With a raw deployment-IP attestation URL, the CLI first requires DNS to contain that IP, then makes a hostname-validated HTTPS health request pinned to it. An empty or NXDOMAIN result skips TLS binding; other DNS, redirect, HTTPS, metadata, or fingerprint failures are fatal. On this skip path, `caution verify` still reports attestation verification passed and writes `.caution/trusted_hashes.json` without a `tls` object. Treat that result as PCR-only, not Attested TLS verification, and rerun after DNS is configured.

Attested TLS deliberately preserves ordinary browser HTTPS expectations, so the client does not validate Nitro evidence. Run this verification periodically and ad hoc after relevant deployment, DNS, or certificate changes. Where STEVE-specific client code can be integrated, STEVE provides the stronger client-aware design. Ordinary proxy-level HTTPS that is not configured for Attested TLS receives only the base Nitro/PCR verification. `--pcrs` is also PCR-only: it performs no TLS check and removes any stale `tls` object from the persisted trusted state.

## Inspect the reproduced build

During verification, the CLI prints a build artifacts directory. Open that directory to review what went into the reproduced enclave image:

| Path | What to inspect |
|------|-----------------|
| `Containerfile.eif` | Complete enclave image build recipe |
| `app/` | Application source and packaged files |
| `enclave/` | EnclaveOS source, including init and attestation service code |
| `run.sh` | Generated startup script |
| `manifest.json` | Build provenance, pinned Platform framework source, source URLs, commits, and metadata |

Reviewing these files is the step that turns attestation into practical verifiability: you can inspect capabilities in source, then prove that the deployed enclave corresponds to that source.

## If verification fails

Use the failure message to choose the next step:

| Failure | What to do |
|---------|------------|
| Debug-mode warning | Remove the `debug` block from `caution.hcl`, redeploy, and verify again. |
| Manifest has no app commit | The CLI uses local `HEAD`; confirm that it is the intended source before trusting the result. |
| Manifest commit is unavailable locally | Fetch that commit, use `--app-source-url`, use `--from-tarball`, or use `--pcrs`. |
| Private source unavailable | Provide an authorized Git URL with `--app-source-url`, or verify from an authorized local checkout. |
| PCR mismatch | Treat the app as unverified. Confirm the source commit, build inputs, and deployment are the ones you intended; then retry with `--no-cache`. |
| Attestation endpoint unreachable | Check the exact endpoint URL from deployment output or app operator instructions. |

## Verification and encryption

Verification proves what code is running. If the app also needs to keep request and response data hidden from the host system, use STEVE for application-layer end-to-end encryption. Attested TLS is a compatibility mode that terminates ordinary TLS inside the enclave, but requires periodic external verification of the live certificate binding.

See [Use STEVE clients](use-steve-clients.md) for browser, CLI, Rust, and Swift integration, including pinned PCRs and TOFU.

## See also

<div class="grid cards" markdown>

- :lucide-fingerprint: **Attestations**

    ---

    Learn how Caution [verifies enclave integrity](../concepts/attestation.md) with hardware-backed proofs.

- :lucide-shield-check: **Verifiability**

    ---

    Learn why Caution ties [running enclaves back to source](../concepts/verifiability.md).

</div>
