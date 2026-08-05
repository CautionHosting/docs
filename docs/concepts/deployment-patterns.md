---
icon: lucide/git-branch
---

# Deployment patterns

<p class="docs-home-intro">Learn how to choose between public, private, and fully private verification patterns based on who needs to verify your workload and how much source visibility you can allow.</p>

## Public verification

For services where external users or third parties need to verify what code is running, the source code must be publicly available. A verifier can check out the repository and run `caution verify --attestation-url <url>` from it. The CLI uses the local checkout at the manifest commit by default.

**How it works:**

1. Source URLs and commits are published in the attestation response manifest
2. Verifiers review an appropriate local checkout
3. The CLI stages the manifest commit, rebuilds locally, and compares the PCR values with authenticated Nitro evidence
4. As explicit alternatives, verifiers can select a Git source with `--app-source-url` or an exact archive with `--from-tarball`

**Example use cases:**

- **LLM inference services** - Users verify the model and inference code haven't been tampered with, ensuring responses come from the expected model without hidden modifications.

- **VPN services** - Users verify the VPN server code to confirm it's not logging traffic or injecting content.

- **Blockchain oracles** - Smart contracts and users verify that price feeds and external data come from untampered code running the expected logic.

- **Tor nodes** - Network participants verify relay nodes are running unmodified Tor software.

- **Blockchain nodes** - Users verify full nodes and validators are running the canonical implementation without modifications.

## Private verification

For internal systems where verification happens within your organization, source code can remain private. Verify from an authorized local checkout, or use `--app-source-url` with credentials already configured for Git.

**How it works:**

1. Source URLs can point to private repositories
2. Authorized verifiers check out the source locally or select an explicit Git URL or tarball
3. Verification stages the manifest commit and proceeds within your organization

**Example use cases:**

- **Policy engines** - Internal services verify the policy engine is running approved code before trusting its decisions. A payment service verifies the fraud detection engine; a data pipeline verifies the access control service.

- **Digital asset custody** - Wallet infrastructure verifies signing services are running audited code before routing transactions.

- **Internal APIs** - Microservices verify each other before exchanging sensitive data.

## Fully private (BYOC)

For maximum privacy, deploy to your own infrastructure using [bring your own compute](../reference/byoc.md). Source repositories never leave your network, and verification happens entirely within your VPC.

**How it works:**

1. Source code lives in internal repositories
2. Caution manages the enclave lifecycle within your AWS account
3. Verification happens inside your network
4. No repository URLs or code are exposed externally

**Example use cases:**

- **Regulated industries** - Financial services or healthcare workloads where code and infrastructure must remain within controlled environments.

- **Air-gapped systems** - High-security environments with no external network access.

- **Proprietary algorithms** - Trading systems or ML models where the logic itself is a competitive advantage.

## Choosing a pattern

| Pattern | Source visibility | Who can verify | Best for |
|---------|-------------------|----------------|----------|
| Public | Public repos | Anyone | Consumer-facing services, open-source projects |
| Private | Private repos (auth required) | Your organization | Internal services, B2B platforms |
| Fully private | Internal only | Your infrastructure | Regulated industries, proprietary systems |

You can also combine patterns. A service might have public-facing components with open source code, while keeping proprietary business logic in private repositories that only internal services verify.

## See also

<div class="grid cards" markdown>

- :lucide-cloud: **Fully managed**

    ---

    Deploy using [Caution's managed infrastructure](../reference/fully-managed.md).

- :lucide-server: **Bring your own compute**

    ---

    Run Caution enclaves in [your own AWS account](../reference/byoc.md).

</div>
