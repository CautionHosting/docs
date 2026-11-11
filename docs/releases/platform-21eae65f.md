# 2026-11-11

These notes cover changes from
[`7edee03f`](https://git.caution.co/public/platform/commit/7edee03fe36ba5f0dab5df7578444fa6c630d966)
through [`21eae65f`](https://git.caution.co/public/platform/commit/21eae65f26a2045ce5631fbb80b3b6ccec210593).

## Features and improvements

- Added VPC selection to BYOC setup: `caution init --byoc --vpc-id vpc-xxx` provisions into an existing VPC instead of creating a dedicated one, and `--subnet-ids subnet-a,subnet-b` (requires `--vpc-id`) restricts which of the VPC's subnets are used. Without `--subnet-ids`, the provisioner uses every subnet in the VPC. Both flags are validated up front (`vpc-`/`subnet-` prefixes, rejected with `--config`), the confirmation summary reports the existing VPC rather than promising a new dedicated one, and teardown warns that only the provisioner's dedicated VPC is destroyed — an existing VPC is left untouched. The corresponding `SUBNET_IDS` support in the provisioner container has landed in [bring-your-own-compute-setup](https://git.caution.co/public/bring-your-own-compute-setup) and is included in the published provisioner image (see the [BYOC guide](../quickstart/byoc.md)).
- The default provisioner image, framework archive URLs and example Git remotes now point at the canonical forge (`git.caution.co/public/...`) instead of the legacy Codeberg locations.

## Dependency updates

- Updated `russh` to 0.65.1 and `vue` to 3.5.45.
