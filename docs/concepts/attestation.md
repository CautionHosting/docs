---
icon: lucide/fingerprint
---

# Attestations

<p class="docs-home-intro">Learn what attestations are, how hardware-rooted proofs work in confidential compute, and how Caution verifies enclave integrity.</p>

## What attestations are

The backbone of confidential compute consists of hardware trust anchors that provide mechanisms to isolate workloads and encrypt memory, along with protected private keys that can be used to attest to (vouch for) what is running inside a confidential compute workload.

Different hardware platforms such as Intel TDX, AMD SEV-SNP, TPM 2.0, and Nitro provide attestation capabilities: they can measure the state of a server and provide *cryptographic signatures* of hashes of that data. This is what "attestations" are. They are also referred to as *cryptographic remote attestations*.

!!! info "AWS Nitro support today"
    Caution currently supports deployments on AWS Nitro Enclaves. We are actively working on support for Intel TDX, AMD SEV-SNP, and TPM 2.0 attestations.

## How attestation verification works

When you run `caution verify`, the CLI authenticates fresh Nitro evidence and compares its measurements with values reproduced from source selected by the verifier.

### 1. Generate a challenge nonce

The CLI generates a random 32-byte nonce (number used once). This nonce prevents replay attacks. An attacker cannot reuse an old attestation document because each verification requires a fresh nonce.

### 2. Request attestation from the enclave

The CLI sends the nonce to the enclave's public `/attestation` endpoint. Caution proxies that path internally to bootproofd on reserved port `49502`. The response contains a signed Nitro attestation document and a sibling manifest used as source metadata.

The signed document includes:

- The nonce (echoed back)
- [PCR values](https://docs.aws.amazon.com/enclaves/latest/user/set-up-attestation.html){:target="_blank"} (Platform Configuration Registers), cryptographic measurements of the enclave image
- A certificate chain signed by the AWS Nitro root CA

The attestation document is signed using COSE (CBOR Object Signing and Encryption) with the NSM's private key.

The manifest is not part of that signed Nitro evidence. It supplies source and commit metadata; the PCR comparison is what checks whether the selected source reproduces the measurements authenticated by Nitro.

### 3. Stage the selected source and reproduce the build

By default, run `caution verify` from a local application checkout. The CLI learns the app commit from the fresh response manifest, stages that commit from the local repository once, reads its existing configuration, and reproduces the enclave build. If the manifest has no app commit, it uses local `HEAD`.

Use `--app-source-url` for an explicit Git source or `--from-tarball` for an exact archive. Use `--pcrs` only when you already have expected PCR values; that mode does not inspect source or verify an Attested TLS certificate binding.

### 4. Verify Nitro evidence and expected PCRs

The existing Bootproof verification checks the AWS Nitro certificate chain and validity, COSE signature, fresh nonce, and expected PCR0, PCR1, and PCR2. The authenticated PCRs are compared with the locally reproduced or explicitly supplied values.

For a source-backed `mode = "tls"` deployment, the CLI then validates the authenticated TLS metadata and live leaf-certificate binding. Only after every required check passes does it atomically update `.caution/trusted_hashes.json`, preserving the previous state in a unique backup.

The PCR values cover:

- **PCR0** - Hash of the enclave image
- **PCR1** - Hash of the Linux kernel and bootstrap
- **PCR2** - Hash of the application

The important success lines are:

```text
✓ Base Nitro attestation and expected PCR0/1/2 verified
✓ TLS certificate binding verified
✓ Attestation verification PASSED
Trusted state: .caution/trusted_hashes.json
```

!!! tip "Review the source code yourself"
    The verification output shows the build artifacts directory. Inspect the staged source, configuration, generated build recipe, and manifest there before deciding whether to trust what the verified workload does.

## What PCR values represent

Attestation verification compares these PCR measurements to confirm the enclave is running the expected image, kernel, and application code.

| PCR | Description |
|-----|-------------|
| PCR0 | Enclave image file - a hash of the entire enclave image |
| PCR1 | Linux kernel and bootstrap - measures the kernel and init process |
| PCR2 | Application - measures your application code |

Because these are cryptographic hashes, even a single byte change in the source code produces completely different PCR values.

## Multi-hardware attestation

### Single-hardware trust problem

Most solutions today are based on a single confidential compute technology. Using confidential compute is a good upgrade over standard ways to run software, but it roots trust in a single manufacturer that provides the confidential compute technology. Like all companies, large manufacturers are susceptible to bugs and compromise. By rooting trust in only one piece of hardware, users of this technology expose themselves to single points of failure (SPOFs).

### Multi-hardware trust solution

To address the risk of rooting trust in a single hardware vendor, along with inherited risks across software, firmware, hardware supply chains, and operational practices, the team behind Caution designed [EnclaveOS](https://git.distrust.co/public/enclaveos){:target="_blank"}. Caution currently supports AWS Nitro Enclaves, and a new version of EnclaveOS with multi-hardware support is in active development. You can learn more in [this blog post](https://distrust.co/blog/enclaveos.html){:target="_blank"}.

This OS is designed to leverage multiple attestation technologies for a single workload, requiring all of them to agree on the workload state before its integrity is considered intact. This hardware-level distribution of trust is unique to Caution and EnclaveOS at the time of writing.

## See also

<div class="grid cards" markdown>

- :lucide-file-text: **EnclaveOS**

    ---

    Learn about EnclaveOS in [this blog post](https://distrust.co/blog/enclaveos.html){:target="_blank"} by our sister company, Distrust.

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](verifiability.md) from source to production.

- :lucide-refresh-cw: **Reproducibility**

    ---

    Enable independent verification with [deterministic builds](reproducibility.md).

</div>
