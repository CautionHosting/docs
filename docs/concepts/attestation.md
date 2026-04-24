---
icon: lucide/fingerprint
---

# Attestation

The backbone of confidential compute are hardware trust anchors which offer both mechanisms to isolate workloads and encrypt memory as well as protected private keys which can be used to attest to (vouch for) what's running inside of a confidential compute workload.

Different hardware, such as Intel TDX, AMD SEV-SNP, TPM 2.0, Nitro, all provide attestation capabilities, where they can measure the state of a server and provide *cryptographic signatures* of hashes of said data - this is what "attestations" are. They are also referred to as *cryptographic remote attestations*.

The current version of Caution only supports [AWS Nitro](https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html){:target="_blank"}.

## How verification of attestations works

When you run `caution verify`, the CLI performs a multi-step verification process to prove that the code running in a remote enclave matches exactly what you expect.

### Step 1: Generate a challenge nonce

The CLI generates a random 32-byte nonce (number used once). This nonce prevents replay attacks - an attacker cannot reuse an old attestation document because each verification requires a fresh nonce.

### Step 2: Request attestation from the enclave

The CLI sends the nonce to the enclave's attestation endpoint. The enclave's Nitro Security Module (NSM) generates an attestation document that includes:

- The nonce (echoed back)
- [PCR values (Platform Configuration Registers)](https://docs.aws.amazon.com/enclaves/latest/user/set-up-attestation.html){:target="_blank"} - cryptographic measurements of the enclave image
- A certificate chain signed by the AWS Nitro root CA
- A manifest containing source URLs and commit hashes

The attestation document is signed using COSE (CBOR Object Signing and Encryption) with the NSM's private key.

### Step 3: Verify the attestation document

The CLI verifies the attestation document:

1. **Certificate chain verification** - Validates that the signing certificate chains back to the AWS Nitro root CA, proving the attestation came from genuine Nitro hardware
2. **Signature verification** - Verifies the COSE signature using the certificate's public key
3. **Nonce verification** - Confirms the returned nonce matches the one sent, preventing replay attacks

### Step 4: Reproduce the build

Using the manifest from the attestation (which contains source URLs and commit hashes), the CLI reproduces the enclave build locally. This generates the expected PCR values - the same cryptographic measurements that would result from building the exact same code.

### Step 5: Compare PCR values

Finally, the CLI compares:

- **PCR0** - Hash of the enclave image
- **PCR1** - Hash of the Linux kernel and bootstrap
- **PCR2** - Hash of the application

If all PCR values match, the verification passes. This proves that the remote enclave is running exactly the code specified in the manifest, built in exactly the same way.

```text
✓ Certificate chain verified against AWS Nitro root CA
✓ COSE signature verification passed
✓ Nonce verified (prevents replay attacks)
✓ Attestation verification PASSED
```

!!! tip "Review the source code yourself"
    During verification, all source code is pulled to `~/.cache/caution/reproductions/local/<your_build_id>`. The verification process output will show you the exact location. You can inspect this directory to review the exact code used to build the enclave image running inside the enclave.

## What PCR values represent

| PCR | Description |
|-----|-------------|
| PCR0 | Enclave image file - a hash of the entire enclave image |
| PCR1 | Linux kernel and bootstrap - measures the kernel and init process |
| PCR2 | Application - measures your application code |

Because these are cryptographic hashes, even a single byte change in the source code produces completely different PCR values.

## Multi-hardware attestation

### The problem

Most solutions today are based on a single confidential compute technology. Using confidential compute is a good upgrade over standard ways to run software, but it roots trust in a single manufacturer which provides the confidential compute technology. As all companies, large manufacturers are susceptible to bugs and compromise. By rooting the trust in only one piece of hardware, users of this technology expose themselves to single points of failure (SPOFs).

### The solution - multi-hardware

To address this failure of rooting all trust in a single hardware, along with its inherited risks that span the software, firmware and hardware supply chains, operational practices and all other risks stemming from the organization which creates a confidential compute, the team behind Caution designed [EnclaveOS](https://git.distrust.co/public/enclaveos){:target="_blank"}. Caution currently supports AWS Nitro, but the new version of EnclaveOS with multi-hardware support is in active development, and you can learn more about it [here](https://distrust.co/blog/enclaveos.html){:target="_blank"}.

This OS is designed to leverage multiple different attestation technologies for a single workload, requiring them all to agree on the current state of the confidential compute workload in order to consider its integrity to be intact. This distribution of trust on the hardware level is unique to Caution and EnclaveOS as of writing of this document.

## Learn more

- Our sister company [Distrust](https://distrust.co){:target="_blank"} published a [blog](https://distrust.co/blog/enclaveos.html){:target="_blank"} about EnclaveOS

## See also

<div class="grid cards" markdown>

- :lucide-shield-check: **Verifiability**

    ---

    Learn how Caution [ensures code integrity](verifiability.md) from source to production.

- :lucide-refresh-cw: **Reproducibility**

    ---

    Enable independent verification with [deterministic builds](reproducibility.md).

</div>
