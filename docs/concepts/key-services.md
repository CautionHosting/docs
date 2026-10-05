---
icon: lucide/key-round
---

# Key Services

<p class="docs-home-intro">Learn how Caution keeps application secrets encrypted until a quorum of holders releases them to a verified enclave.</p>

To set this up, follow [Add encrypted secrets](../guides/add-encrypted-secrets.md).

## How it works

You encrypt secrets such as database URLs and API keys on your machine and ship
only ciphertext in your application image. The enclave can decrypt them only after
enough **holders** release their **shares** of the quorum key to it. Holders check
the enclave's attestation first, so shares only reach the image you verified.

1. **Keymaker** generates a fresh quorum key, splits it into one encrypted share per
   holder and returns a **quorum bundle** with a proof of how it was generated.
2. You encrypt values to the bundle's public key with `caution secret encrypt` and
   package the bundle, its Keymaker policy and the ciphertext into your image.
3. After deployment, holders verify the enclave and release their shares. At the
   threshold, Locksmith reconstructs the key, decrypts the secrets and starts your
   application.

The bundle contains only public keys and encrypted shares, so it is safe to commit.
Keymaker never sees your secret values.

<pre><code class="language-mermaid">flowchart TB
    UI["Dashboard or CLI"] --&gt; Platform["Platform"]
    PGP["External PGP public keys"] --&gt; Platform
    Platform --&gt;|"Passkey holders only"| Certificates["Certificate service"]
    Certificates --&gt;|"Certified public keys and proof"| Platform
    Platform --&gt; Hosted["Hosted Keymaker"]
    Manual["CLI and PGP public keys"] --&gt; Own["Self-hosted Keymaker"]
    Hosted --&gt; Bundle["Proofed quorum bundle"]
    Own --&gt; Bundle
    Bundle --&gt; Encrypt["Local CLI encrypts application values"]
    Encrypt --&gt; Image["App image: bundle, policy, ciphertext"]
    Image --&gt; App["Application enclave: Locksmith"]
    PGPHolder["PGP holder: private key or smartcard"] --&gt;|"Verified destination; signed share"| App
    Passkey["Passkey holder approval"] --&gt; Recryptor["Recryptor"]
    Recryptor --&gt;|"Verified destination; re-encrypted share"| App
    subgraph Custody["Caution key service enclave"]
        Certificates
        Recryptor
    end
    App --&gt;|"Quorum reached"| Run["Decrypt secrets and start application"]
</code></pre>

Public configuration such as ports or feature flags needs none of this. See
[public environment variables](../guides/add-encrypted-secrets.md#public-environment-variables).

## Holders

Each holder contributes one share, whatever their approval method. PGP and passkey
holders can be mixed in one bundle and count towards the same threshold.

| | External PGP holder | Passkey holder |
| --- | --- | --- |
| Private key | Kept by the holder, ideally on a smartcard | Derived and kept inside Caution's key service |
| Approves with | `caution secret send-shard` and their smartcard or keyring | A registered passkey, on a USB key or a phone |
| Share path | Signed and encrypted directly to the application enclave | Re-encrypted by the key service to the application enclave |
| Trusts | Their own key | Caution's key service |

## Trust model

- **The quorum controls recovery.** The application starts only after the threshold
  of distinct holders has released their shares. A threshold of one lets a single
  holder unlock it.
- **Attestation binds shares to your image.** Holders and the key service check fresh
  attestation against your verified PCRs before releasing a share.
- **Passkey holders trust Caution's key service.** Their keys are derived inside an
  enclave Caution operates, and a passkey approval authorizes that enclave to release
  the holder's share. Verify the code it runs with `caution verify --service key-service`,
  and Keymaker with `caution verify --service keymaker`. See
  [Verify Caution key services](../guides/verify-an-app.md#verify-caution-key-services).
- **Keep an external PGP holder in every quorum** if Caution must never be able to
  unlock alone. If passkey holders can reach the threshold by themselves, a
  compromised key service could release their shares without them.
- **Bundles are fixed.** Holders and their passkeys are captured when the bundle is
  created. Removing a member or passkey later does not revoke their share of an
  existing bundle: create a new bundle and rotate the secret values.

## Components

### Keymaker

Keymaker creates bundles and is never called again for an existing bundle. It
reboots after each generation, discarding its in-memory key material. Caution runs a
hosted Keymaker for the dashboard and CLI. You can also
[run your own](../guides/add-encrypted-secrets.md#self-hosted-keymaker) for PGP-only
bundles.

Each bundle carries a proof of the Keymaker image that generated it. The CLI and
your application enclave check that proof against a Keymaker policy you verified.

### Key service

Used only for passkey holders. Caution runs two parts in one enclave:

- **Certificate service**: at bundle creation, derives a PGP key for each passkey
  holder, bound to the organization, bundle and holder, and returns its public
  certificate. Platform verifies it and captures the holder's passkeys in the bundle.
- **Recryptor**: at release, verifies the bundle, the holder's passkey approval and
  the application enclave's attestation. It then decrypts that holder's share and
  re-encrypts it to the enclave. Each approval releases one share, once.

Derived private keys never leave the key service.

### Locksmith

Locksmith runs inside your application enclave. `locksmithd` verifies the bundle's
Keymaker proof, listens for shares on reserved port 49504, proves the enclave's
identity to holders and checks each share against the bundle. At the threshold it
reconstructs the key. `locksmith-oneshot` then decrypts `/etc/caution/secrets/*.asc`
and exports each value as an environment variable before your application starts.

<pre><code class="language-mermaid">sequenceDiagram
    participant Holder as Holder CLI
    participant Locksmithd as locksmithd inside enclave
    participant NSM as Nitro Security Module
    participant Oneshot as locksmith-oneshot
    participant App as Application

    Holder-&gt;&gt;Locksmithd: Connect on port 49504
    Locksmithd-&gt;&gt;NSM: Generate attestation document
    NSM--&gt;&gt;Locksmithd: Signed Nitro attestation
    Locksmithd--&gt;&gt;Holder: Attestation and ephemeral key
    Holder-&gt;&gt;Holder: Verify attestation and PCRs
    Holder-&gt;&gt;Locksmithd: Signed, encrypted share
    Locksmithd-&gt;&gt;Locksmithd: Verify holder and count shares

    alt Threshold reached
        Locksmithd-&gt;&gt;Locksmithd: Reconstruct quorum key
        Oneshot-&gt;&gt;Oneshot: Decrypt .asc secrets
        Oneshot--&gt;&gt;App: Export environment variables
    else Below threshold
        Locksmithd--&gt;&gt;Holder: Wait for more shares
    end
</code></pre>

## Trust policies

Three separate PCR policies are involved. They are not interchangeable.

| Policy | Approves | Where it lives |
| --- | --- | --- |
| Keymaker policy | The image allowed to generate bundles | `.caution/keymaker-pcr-policy.json`, packaged in your image |
| Application measurements | The image allowed to receive shares | `.caution/trusted_hashes.json`, written by `caution verify` |
| Key service policy | The image allowed to handle passkey releases | Saved by `caution verify --service key-service` |

Establish each one from a verified build, never by copying values from the
endpoint being checked.

## Lifecycle

- **Create a bundle once** and reuse it. A new bundle is a new key.
- **Update a value** by re-encrypting it with the same bundle and redeploying.
- **Every new enclave starts locked.** After a deploy or restart, holders release
  their shares again. This needs neither Keymaker nor a new bundle.
- **Keep the bundle, its Keymaker policy and holder credentials.** If fewer than the
  threshold of holders can still approve, the encrypted values cannot be recovered.

Bundles created before the current format need a
[one-time import](../guides/add-encrypted-secrets.md#import-a-v0-bundle).

## Security model

- **Quorum authorization**: the configured number of distinct holders must release
  their shares.
- **Key custody**: external PGP keys stay with their holders. Passkey holders' keys
  stay inside Caution's key service, which releases a share only with that holder's
  passkey approval.
- **Generation provenance**: bundles carry a Keymaker proof, checked against your
  Keymaker policy. Imported V0 bundles have no proof.
- **Attestation**: shares are released only to an enclave whose fresh attestation
  matches your verified PCRs.
- **Signed shares**: each share is signed by its holder's key, so Locksmith accepts
  only holders listed in the bundle.
- **Ephemeral key exchange**: shares are encrypted to an ephemeral key attested by the
  enclave.

## See also

<div class="grid cards" markdown>

- :lucide-key-round: **Add encrypted secrets**

    ---

    [Create a bundle, encrypt values and release shares](../guides/add-encrypted-secrets.md).

- :lucide-badge-check: **Verify an app**

    ---

    Verify apps and [Caution key services](../guides/verify-an-app.md#verify-caution-key-services).

- :lucide-lock: **Encryption**

    ---

    Learn about [end-to-end encryption](encryption.md) with STEVE.

- :lucide-file-code: **caution.hcl**

    ---

    Configure how your application [runs and verifies](../reference/caution-hcl.md).

</div>
