---
icon: lucide/key-round
---

# Add encrypted secrets

<p class="docs-home-intro">Encrypt application secrets to a quorum bundle, ship them in your enclave image and release them to the verified enclave with holder approvals.</p>

See [Key Services](../concepts/key-services.md) for how quorums, holders and the key
service work.

## Before you start

- An application checkout initialized with `caution init` and built from a container
  image. `env::vault` does not work with `build.binary`.
- The Caution CLI installed with `make install-cli`. `send-shard` needs this
  host-toolchain build, not `make install-cli-stagex`.
- Holders registered in your organization:
    - PGP holders add their public key under **Security → PGP keys**. It needs
      signing, encryption and authentication subkeys and must not be expired or revoked.
    - Passkey holders register a passkey under **Security → Authentication**, then
      click **Verify for quorum approval** (PIN or biometric). Unverified passkeys
      cannot be selected.

## 1. Create a quorum bundle

Skip this step if you already have a bundle. Reuse it rather than generating a new
one: a new bundle is a new key.

=== "Dashboard"

    1. Open **Secrets → Create quorum bundle**.
    2. Select members and choose each one's approval method. Pick a PGP key if a
       member has several. **Add PGP holder** adds an external holder from a public
       certificate.
    3. Set the **Quorum threshold**. The dashboard defaults to two and allows up to
       ten holders.
    4. Approve creation with your passkey. This does not approve any release.
    5. Download the JSON from **Use this bundle** and save it as
       `.caution/quorum-bundle.json` in your application checkout.

    Then verify Keymaker and save its policy for your image:

    ```sh
    caution verify --service keymaker
    # Use the trust file path printed by the CLI.
    jq '.policy' /path/to/saved/keymaker.json > .caution/keymaker-pcr-policy.json
    ```

=== "CLI"

    From your application checkout:

    ```sh
    caution login
    caution secret init \
      --holder alice=external-pgp --holder bob=webauthn \
      --threshold 2 --name "Application secrets"
    ```

    - `--holder` takes a username or user ID. Add `--pgp-key alice=FINGERPRINT` if
      Alice has several PGP keys.
    - Pass a public keyring file as the first argument to add external holders.
    - The default threshold is one. Set it explicitly.
    - Unset `KEYMAKER_URL`; it selects a self-hosted Keymaker.

    On first use, the CLI offers to verify Keymaker. It saves
    `.caution/quorum-bundle.json` and `.caution/keymaker-pcr-policy.json` and stores
    the bundle in your organization. If the upload fails, run `caution secret upload`
    instead of generating again. `secret init` overwrites
    `.caution/quorum-bundle.json`, so back it up before running it again.

To generate bundles with your own Keymaker, see
[Self-hosted Keymaker](#self-hosted-keymaker).

## 2. Encrypt values

Put the values in a `.env` file and keep it out of Git:

```bash
DATABASE_URL=postgres://user:password@db.example.com/app
API_KEY=secret-api-token
```

```sh
caution secret encrypt
```

This writes one `.caution/secrets/<KEY>.asc` per value, encrypted to the bundle's
public key. Pass key names to encrypt only some values. Use `--env-file`, `--bundle`
and `--secrets-dir` for other paths. Leading and trailing whitespace is trimmed at
runtime.

Check the bundle before packaging it:

```sh
caution secret inspect
```

`inspect` verifies the Keymaker proof and shows the threshold, holders and approval
methods. Add `-v` for full fingerprints and the bundle ID.

## 3. Reference secrets in caution.hcl

Reference each secret with `env::vault(...)`. Using it enables Locksmith
automatically:

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

`env::vault("NAME")` resolves to the value decrypted from `.caution/secrets/NAME.asc`.
Do not list ports in the reserved `49500`-`49600` range.

## 4. Package the bundle and secrets

Add the bundle, its Keymaker policy and the encrypted values to the final stage of
your `Containerfile`:

```dockerfile
ADD .caution/quorum-bundle.json /etc/caution/bundle.json
ADD .caution/keymaker-pcr-policy.json /etc/caution/keymaker-pcr-policy.json
ADD .caution/secrets/ /etc/caution/secrets/
```

Use the policy file saved by the CLI. Files must be readable by the enclave
(`0644` files, `0755` directories).

Commit the bundle, policy and `.asc` files. Never commit `.env` or private keyrings.

## 5. Deploy and verify

```sh
git push caution main
caution verify
```

`caution verify` reproduces your build, checks the live enclave and saves
`.caution/trusted_hashes.json`. Commit it so all holders share the same baseline,
and rerun it after each deploy. Holders' CLIs refuse to release shares to an enclave
that doesn't match.

## 6. Release shares

Enough distinct holders must release their shares. The application stays locked
until the threshold is reached, then starts with its secrets. Wait for the CLI to
confirm the enclave received the share, not just for your approval.

### PGP holders

=== "Smartcard"

    ```sh
    caution secret send-shard
    ```

    Choose your holder when prompted, or pass `--holder USERNAME`. Then enter your
    card PIN and touch it.

=== "Development keyring"

    ```sh
    caution secret send-shard --keyring alice.private.asc
    ```

### Passkey holders

```sh
# Approve with a USB security key on this machine
caution secret send-shard --holder bob
# Approve on a phone by scanning a QR code
caution --qr secret send-shard --holder bob
```

`--qr` must run under the holder's own Caution login, in the organization that
stores the bundle. On first use, the CLI offers to verify the key service. Compare
the release details in the CLI and on the approval page before approving.

`--holder` takes a username or the full fingerprint from `caution -v secret inspect`.

## Update values and restart

- **Change a value**: re-encrypt it with the existing bundle, redeploy, run
  `caution verify` and release shares again.
- **Restart or redeploy**: the new enclave starts locked. Holders release their shares
  again; no new bundle is needed.
- **Change holders**: create a new bundle and rotate the secret values. Editing a
  bundle's name or labels does not change its holders.

## Self-hosted Keymaker

Run your own Keymaker to create PGP-only bundles without Caution's hosted services.

1. Deploy Keymaker from a separate checkout and verify it:

    ```sh
    git clone https://codeberg.org/caution/locksmith
    cd locksmith
    caution init
    git push caution HEAD:main
    caution verify
    ```

    Keymaker reboots after each generation. Its `caution.hcl` sets
    `restart { policy = "always" }` so it comes back automatically.

2. Create a public keyring with one certificate per holder. Each certificate needs
   signing, encryption and authentication subkeys.

    === "Development and demos"

        ```sh
        caution secret keygen alice.asc --name "Alice" --email alice@example.com --shoot-self-in-foot
        caution secret keygen bob.asc --name "Bob" --email bob@example.com --shoot-self-in-foot
        cat alice.asc bob.asc > keyring.asc
        ```

        Each command also writes an **unencrypted** private keyring such as
        `alice.private.asc`. Anyone who reads it can release that holder's share.
        Never use these keys in production.

    === "Production (smartcard)"

        Keep holder keys on OpenPGP smartcards such as YubiKeys, for example with
        [Keyfork](https://git.distrust.co/public/keyfork). Export the public keys:

        ```sh
        gpg --export --armor alice@example.com > keyring.asc
        gpg --export --armor bob@example.com >> keyring.asc
        ```

3. From your application checkout, generate the bundle:

    ```sh
    caution secret init keyring.asc --threshold 2 --max 2 \
      --keymaker-url https://YOUR_KEYMAKER \
      --keymaker-pcr-policy /path/to/locksmith/.caution/trusted_hashes.json \
      --name "Application secrets" --no-upload
    ```

    `--max` must equal the number of holders. The CLI saves the policy as
    `.caution/keymaker-pcr-policy.json`. Omit `--no-upload` to also store the bundle
    in your organization.

Continue at [Encrypt values](#2-encrypt-values).

## Import a V0 bundle

Bundles created before the current format must be imported once. Import keeps the
quorum key and the existing ciphertext. It supports external PGP holders only.

```sh
caution secret import-legacy --bundle /path/original-v0.json \
  --keyring /path/holder.private.asc   # omit --keyring for a smartcard
caution secret inspect
```

One holder decrypts the bundle metadata; the secret is never reconstructed. The
result is written to `.caution/quorum-bundle.json` and shown as **Legacy V0 — no
Keymaker generation proof**. Add `--upload` to store it in your organization, and
keep the original file.

Package it without a Keymaker policy:

```dockerfile
ADD .caution/quorum-bundle.json /etc/caution/bundle.json
ADD .caution/secrets/ /etc/caution/secrets/
```

Add `--allow-legacy` to every `secret encrypt` and `secret send-shard` for this
bundle.

## Public environment variables

Values that don't need encryption, such as ports, feature flags or public URLs, go in
`/etc/environment` in your image. They need no bundle or holders:

```dockerfile
RUN echo "APP_PORT=3000" >> /etc/environment
RUN echo "LOG_LEVEL=info" >> /etc/environment
```

In multi-stage builds, copy `/etc/environment` into the final stage:

```dockerfile
FROM stagex/pallet-rust AS build
RUN printf '%s\n' 'APP_PORT=3000' 'LOG_LEVEL=info' > /tmp/environment

FROM stagex/core-filesystem AS run
COPY --from=build /tmp/environment /etc/environment
COPY --from=build /myapp /app/myapp
ENTRYPOINT ["/app/myapp"]
```

Caution does not pass Docker build arguments, so build-time values must also live
in the Containerfile or files copied into the image.

## See also

<div class="grid cards" markdown>

- :lucide-key-round: **Key Services**

    ---

    Understand [quorums, holders and trust](../concepts/key-services.md).

- :lucide-badge-check: **Verify an app**

    ---

    Verify apps and [Caution key services](verify-an-app.md#verify-caution-key-services).

- :lucide-file-code: **caution.hcl**

    ---

    Configure how your application [runs on Caution](../reference/caution-hcl.md).

</div>
