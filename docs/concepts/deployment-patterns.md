---
icon: lucide/git-branch
---

# Deployment patterns

Caution supports different verification models depending on who needs to verify your workload and how much you want to expose.

## Public verification

For services where external users or third parties need to verify what code is running, the source code must be publicly available. Anyone can run `caution verify` against your deployment and independently confirm the code matches the attestation.

**How it works:**

1. Source URLs are embedded in the enclave manifest
2. Verifiers pull the public source code
3. They rebuild the enclave image locally
4. PCR values are compared against the attestation

**Example use cases:**

- **LLM inference services** - Users verify the model and inference code haven't been tampered with, ensuring responses come from the expected model without hidden modifications.

- **VPN services** - Users verify the VPN server code to confirm it's not logging traffic or injecting content.

- **Blockchain oracles** - Smart contracts and users verify that price feeds and external data come from untampered code running the expected logic.

- **Tor nodes** - Network participants verify relay nodes are running unmodified Tor software.

- **Blockchain nodes** - Users verify full nodes and validators are running the canonical implementation without modifications.

## Private verification

For internal systems where verification happens within your organization, source code can remain private. The CLI prompts for authentication when pulling from private repositories.

**How it works:**

1. Source URLs point to private repositories
2. Verifiers authenticate to pull the code (only the repo URL is visible, not the code itself)
3. Verification proceeds as normal within your organization

**Example use cases:**

- **Policy engines** - Internal services verify the policy engine is running approved code before trusting its decisions. A payment service verifies the fraud detection engine; a data pipeline verifies the access control service.

- **Digital asset custody** - Wallet infrastructure verifies signing services are running audited code before routing transactions.

- **Internal APIs** - Microservices verify each other before exchanging sensitive data.

## Fully private (managed on-premises)

For maximum privacy, deploy to your own infrastructure using [managed on-premises](../reference/managed-on-premises.md). Source repositories never leave your network, and verification happens entirely within your VPC.

**How it works:**

1. Source code lives in internal repositories
2. Caution builds and deploys within your AWS account
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
