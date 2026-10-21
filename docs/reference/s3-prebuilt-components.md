# S3 prebuilt components (operators)

This runbook is for platform operators preparing and selecting a pinned set of runtime components. It is not an application `caution.hcl` option or a customer quickstart. It applies to platform versions with automatic component preparation through `make up`.

!!! warning "Prebuilt is the default"
    `make up` prepares the component selection with the matching API image and source pins, then continues directly to migrations and normal service restarts. It does not pause for release review. Complete the [activation checklist](#api-selection-and-failure-handling) before running it. Other services keep their existing startup paths. Do not calculate or paste `COMPONENT_SET_SHA256` into `.env`: leaving it unset does **not** select source builds. Explicit source mode has separate host-helper prerequisites described below. Production activation and IAM changes require separate review and authorization.

## Artifact and trust boundaries

A set covers EnclaveOS init, bootproof, STEVE, Locksmith's `locksmithd` and `locksmith-oneshot` together, and tap-framer. Application compilation, kernel/base-image delivery, and `remote-build-helper` packaging are unchanged. Consumers fetch only the components required by the application; publication prepares the complete set.

Canonical artifacts use the existing platform artifact bucket, outside `eifs/`:

```text
components/v1/builds/<build-spec-sha256>.json
components/v1/blobs/sha256/<binary-sha256>/<component-filename>
components/v1/manifests/sha256/<component-set-sha256>.json
```

The build-spec digest identifies pinned source, recipe, toolchain, target and build options. Binary digests identify the resulting bytes. The component-set digest pins the canonical manifest. None is interchangeable with a Git revision or enclave PCR.

Retain reviewed release locks in a trusted location **outside the writable S3 artifact store**, with approval and build evidence. An S3 index, ETag, digest-shaped key or adjacent checksum is not independent acceptance of the binary. Someone able to replace both bytes and their advertised digest can defeat checks that trust only that store.

## Prepare components with the API

Before preparation, use a reviewed platform checkout with no tracked changes on the configured Linux/x86_64 Docker host. You need Docker/BuildKit and buildx, a local Docker socket, Git, GNU Make, `flock`, Python 3 and the service-build prerequisites. Configure `~/.config/caution/.env` from the platform's `env.example`. The candidate image packages the publisher; no host Rust/Cargo installation or manual EnclaveOS checkout is needed. First use needs capacity and network access to compile pinned sources.

The bucket must already exist: nonempty `COMPONENTS_S3_BUCKET` takes precedence over `EIF_S3_BUCKET`, then `caution-eif-storage-<AWS_ACCOUNT_ID>`. Review the [IAM requirements](#iam-and-byoc-delivery) and authorize publication to that bucket before preparing. Sufficient existing deployment credentials can be reused; no new bucket or role is required. Neither preparation nor `make up` creates buckets or changes IAM, policies or lifecycle settings. Preparation reads the operator `.env` and exported `AWS_*` credentials, including session tokens, but does not mount host AWS profile/SSO files. Runtime consumers still need credentials in the operator `.env`; shell-only publisher credentials do not supply runtime read access.

**Preparation is not read-only:** it publishes component artifacts and updates the generated API selection. Coordinate it with service restarts, since the next API start will consume that selection. It does not migrate the database or restart services. This runs during platform setup/update, not for each application deployment.

For preparation without migration or service restart, build the candidate API image and prepare its selection separately:

```sh
make build-api API_IMAGE=caution-api-components
make prepare-components API_IMAGE=caution-api-components
```

The component-only helper resolves source pins with the candidate image's `prepare-components --print-inputs`, checks the clean checkout and API framework commit, captures the API image ID and prepares components from a frozen source checkout. It source-builds specifications not already accepted locally, even if S3 has an index. Retained accepted locks permit verified warm reuse; S3 is never its own acceptance authority. `make up` includes these preparation steps but then continues to migration and service restarts.

The helper retains private component state under `~/.config/caution/`: `components/accepted/<sha256>.json` holds independently retained accepted locks, and `components/build-*/` retains build logs. After successful runtime-reader preflight, it atomically writes `components.env` containing the API image ID, framework/tool pins, mode, bucket and set digest. Preserve accepted locks and the selected API image; do not edit generated selections or replace locks from S3. Standalone Rust `prepare-components` publication does not select a set.

### Accepted historical locks and failure handling

`make up` checks the retained accepted locks against their filename hashes and passes them to the publisher. In standalone use, `--output-lock` is **never implicitly trusted**, even if that file already exists; use a fresh output path and explicitly supply previously accepted locks with repeatable `--accepted-lock`.

| Condition | Required behavior |
|---|---|
| Accepted index and every binary match the retained descriptor | Reuse without compilation. |
| Accepted index or binary is explicitly missing | Rebuild pinned inputs; the complete descriptor, including every output digest, must equal the accepted descriptor before publication. |
| Present index is substituted, a binary is corrupt, access is denied, or a request fails | Stop. These are not ordinary cache misses and must not establish new accepted hashes. |
| No accepted mapping exists for the specification | Compile from pinned source before accepting outputs; an existing S3 index alone cannot authorize reuse. |
| Publication is interrupted or conflicts with existing bytes | Stop; do not activate or delete previous objects. Investigate and retry with the retained accepted locks. |

Locksmith's companion outputs are checked together. Changing a source pin creates a new build specification; unrelated components can be reused when their full specifications are unchanged. Tap-framer's source pin is currently the **whole platform commit**, not a helper-source subtree hash, so unchanged helper source does not imply reuse across API releases. Prepare the matching set for each API release. Never fix a historical hash mismatch by editing its accepted lock to match the new bytes.

## API selection and failure handling

Before activation, complete the preparation prerequisites above and install the platform systemd user units, including the updated API unit. Then:

- Preserve the generated API selection, accepted locks and referenced API image.
- Review candidate source/specification identities and output hashes against retained acceptance and independent build evidence. Retain the unmodified canonical output lock; reformatting it changes its file hash.
- Confirm the selected manifest and required binaries can be read and verified by the actual consumers. Validate IAM separately as described below.
- Review database compatibility before the rollout. `eif_builds.component_artifacts` and deployment configuration retain the selected set digest and paired host sidecar key/hash, including cache hits. This is runtime provenance, not a garbage-collection registry.
- Ensure the API's framework and component source pins match the selected set. Replacing only the digest while retaining incompatible source pins fails validation.
- Complete the [evidence gates below](#evidence-limits-and-release-gates) in an authorized disposable environment. A successfully published manifest alone is not a production-readiness gate.

These are manual release obligations, not checks that `make up` completes for you. After completing them and obtaining rollout authorization, run from the same reviewed checkout:

```sh
make up
```

`make up` builds the service images and repeats preparation, then continues to ordinary migrations and systemd restarts without a review pause. In prebuilt mode, the candidate API's `--check-components` reads and validates the selected manifest using API runtime credentials, and checks active source pins and recipes. It does **not** download every component binary or prove builder/host IAM access. Binary verification happens later during staging. In source mode there is no selected-manifest read.

This preflight runs **before** migrations or service restarts and exits before database connections, background workers or listener startup. Only after it succeeds is the generated API environment replaced. Only the API reads `components.env`: its systemd unit uses `EnvironmentFile`, and `make run-api` exports those values to the existing Docker command. Both paths validate before removing the API container. Gateway, email and metering do not consume component state. Update installed units normally; Make reloads them but does not install managed drop-ins or rewrite operator units. There is no platform release controller, shared service launcher, all-service release record or activation journal.

Before choosing source fallback, follow the reviewed [`src/tap-framer/host.sha256` build/pin procedure](https://git.caution.co/public/platform/src/branch/main/src/tap-framer/README.md). Source mode still requires that independently reviewed host-helper pin; do not replace it with a builder-provided checksum. Subject to the same activation prerequisites and authorization, run `make up COMPONENT_BUILD_MODE=source`. This skips publication and clears stale digest/bucket selection in the generated API environment. Set `COMPONENT_BUILD_MODE=source` in the operator `.env` to persist that choice for later updates. Editing `.env` or unsetting a digest does not change the already generated API selection. Ordinary application deployment captures the selected set before cache lookup; it does not publish or promote component versions.

A preparation failure preserves the prior API selection and runs no migrations or restarts. Failure after preparation may already have migrated the database or restarted services. Inspect the ordinary service/database state and use the existing operational recovery procedure, checking schema compatibility first. There is **no automatic rollback or database-migration undo**, no recovery journal and no separate release-recovery command. Rebuilding a mutable API tag alone does not change the generated image/component selection.

Existing EIFs must keep their own host/guest pairing. Host bootstrap uses the persisted `<eif-key>.tap-framer` sidecar key and expected digest and verifies before installation/execution, rather than selecting the API's current component set. Retain old EIFs, sidecars, component objects and accepted locks for replacement and rollback. Do not substitute the newest helper for an old deployment. Guest attestation does not authenticate execution on the ordinary host.

## IAM and BYOC delivery

The table describes **minimum operational access by path**, not enforced separation of IAM principals. Ordinary same-bucket managed consumption needs only reads, but the current bootstrap platform principal also receives conditional component `s3:PutObject` authority. Separating publisher credentials from ordinary application building and hosting requires an explicit IAM design and review. Scope object permissions to the intended bucket's `components/v1/*`; bucket-level `s3:ListBucket` permissions need a corresponding prefix condition. Existing `builds/` and `eifs/` permissions serve different operations and do not by themselves grant component publication.

| Operation/path | Minimum component access |
|---|---|
| Release publisher (existing sufficient credentials may be reused) | Prefix-scoped `s3:GetObject`, `s3:PutObject`, and `s3:ListBucket` for lookup, conditional publication and readback. Neither component deletion nor lifecycle administration is required. |
| Platform API and ordinary managed builders/hosts, same-bucket consumption | `s3:GetObject` and appropriate prefix-scoped listing. No component PUT requirement for this path; this is not a claim that the platform principal lacks write authority. |
| BYOC relay source client | Platform credentials read the canonical bucket. |
| BYOC relay destination client | Separate customer credentials read and conditionally write the customer's component prefix and verify destination bytes. Customer runtime hosts read their own artifacts. |

Component publication and relay writes use `If-None-Match: *` for create-only PUTs, with exact readback verification. The bootstrap's component PUT grants require this condition; they do not authorize unconditional replacement through those grants.

BYOC transfer is a bounded, verified relay: source **GET with platform credentials**, then destination **PUT with customer credentials**, followed by destination verification. It is not a server-side cross-account `CopyObject` request and does not require new cross-account bucket grants. A customer-only cache miss transfers verified bytes; it does not compile customer-specific shared components. The full unchanged pinned set manifest accompanies the required component subset.

Inspect effective customer policies, bucket restrictions, SCPs, region and any KMS permissions during an authorized rollout. Existing BYOC policy coverage or a local emulator test is not proof that a particular installed account permits the transfer. An alternate `COMPONENTS_S3_BUCKET` also needs explicit access; policies scoped to the default artifact bucket do not automatically cover it. For managed deployments, the bootstrap variable `components_source_bucket_name` grants platform reads of alternate-source blobs/manifests and conditional relay writes into the EIF bucket, where builders remain read-only consumers. It does **not** grant publication authority in the alternate source bucket; cross-account reads also require permission from that bucket's owner. IAM definitions in source are not proof they have been applied.

## Evidence limits and release gates

Independent source verification remains separate from prebuilt consumption. First use a CLI that supports standalone component Containerfile rendering and selected-revision source staging: downloaded historical templates cannot upgrade an older CLI's shared builder. Reconstruct the historical manifest's pinned source/recipe inputs, rebuild the components, and check the accepted binary hashes and resulting measurements. If reproduction fails on missing component sources or unexpanded template markers, upgrade to a compatible CLI and retry the same verification with `--no-cache`. Keep the manifest's pins and PCR checks; do not substitute the current build-inputs endpoint or reuse the downloaded binaries being verified.

Record evidence for the exact candidate, distinguishing each layer:

- **Publisher/store tests:** accepted warm reuse, missing accepted index/blob repair, first-use source qualification, corruption/denial/conflict rejection, complete Locksmith outputs, and interrupted publication. Mocks establish protocol behavior, not effective AWS IAM.
- **Disposable component builds:** cold publication, warm reuse without compilation, and a changed pin rebuilding only the components whose full specifications changed. Preserve recipe identities; a network/mirror workaround that changes the recipe is not evidence for the unmodified release recipe.
- **Actual EIF composition and reproduction:** source and prebuilt paths agree on component bytes and expected PCRs for the same manifest, including optional STEVE/Locksmith selections. Component compilation or template inspection alone does not prove EIF/PCR equality.
- **Runtime and account checks:** paired host/guest networking, digest failure before host execution, restart of an older deployment after promotion, managed read-only consumption, BYOC destination-only misses, preparation failure preserving the API selection, and runtime credentials reading the prepared set before migration/restart.

Do not claim production readiness while real EIF, runtime or effective-IAM evidence is incomplete. Compilation on a role-free disposable host does not authorize IAM application, canonical production publication or activation.

This feature introduces **no component deletion, garbage collection, expiry, lifecycle-policy changes, or EIF retention changes**. Rollback preserves artifacts; it is not a cleanup operation.

For implementation details and matching source procedures, see the canonical platform [component build documentation](https://git.caution.co/public/platform/src/branch/main/containerfiles/README.md) and [bootstrap IAM definitions](https://git.caution.co/public/platform/src/branch/main/infra-bootstrap/main.tf).
