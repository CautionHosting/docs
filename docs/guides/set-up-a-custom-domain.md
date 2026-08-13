---
icon: lucide/globe
---

# Set up a custom domain

<p class="docs-home-intro">Point your own subdomain to a stable Caution-managed DNS target.</p>

## Overview

A deployed app receives a stable DNS target such as
`<app-id>.apps.caution.sh`. Caution owns the A record for that target and keeps
it pointed at the app's current Elastic IP. You own the custom hostname and
create a CNAME from it to the Caution target:

```text
api.yourdomain.com  CNAME  <app-id>.apps.caution.sh
                              A  <current-app-ip>
```

A CNAME is a DNS alias, not an HTTP redirect. Requests continue to use
`api.yourdomain.com`; DNS resolves that name through the managed target to the
current app IP.

Setting up a custom domain involves three steps:

1. Configure the custom hostname in `caution.hcl`.
2. Deploy the app and copy its `DNS target`.
3. Create a customer-owned CNAME pointing to that target.

!!! warning "This CNAME flow requires a subdomain"
    DNS standards do not allow a conventional CNAME at a zone apex such as
    `yourdomain.com`. Use a hostname such as `api.yourdomain.com` for this flow.
    Some DNS providers offer provider-specific ALIAS, ANAME, or CNAME-flattening
    behavior at an apex; verify that behavior with your provider separately.

## Step 1: Configure your caution.hcl

Set `domain` in the `http` block, fronting the port your app listens on:

```hcl
network {
  ingress {
    cidr_ipv4 = "0.0.0.0/0"
    port      = 8080
  }
  http {
    domain = "api.yourdomain.com"
    port   = 8080
  }
}
```

The hostname must be configured before deployment so Caution's HTTP and TLS
routing recognizes it. DNS alone does not configure application routing.

## Step 2: Deploy and get the DNS target

Deploy or redeploy after changing `caution.hcl`:

```bash
git push caution main
```

Then retrieve the app details:

```bash
# From the app directory (uses .caution/deployment.json)
caution apps get

# Or specify an app ID directly
caution apps get <app-id>
```

The CLI and dashboard show both the managed target and its publication state:

```text
DNS target: <app-id>.apps.caution.sh
Managed DNS: ready
```

Wait for `Managed DNS: ready` before depending on the target. The output may
also show the current public IP for diagnostics, but do not create a customer A
record for that IP. The IP can change during the app lifecycle while the DNS
target remains stable.

## Step 3: Create the CNAME

At the DNS provider for `yourdomain.com`, create this record:

| Record type | Host | Value |
|-------------|------|-------|
| CNAME | `api` | `<app-id>.apps.caution.sh` |

DNS providers differ in whether the host is entered as `api` or the full
`api.yourdomain.com`. Some also append a trailing dot to the target; both forms
represent the same DNS name.

Caution does not create, modify, or delete this record. It manages only the A
record for the displayed `DNS target`.

## Step 4: Verify DNS and HTTPS

After your DNS provider publishes the CNAME, verify the complete chain:

```bash
dig CNAME api.yourdomain.com +short
dig A api.yourdomain.com +short
curl -I https://api.yourdomain.com
```

The CNAME query should return the app's `DNS target`; the A query should return
its current public IP. DNS propagation time depends on your provider and the
previous record's TTL. If replacing a direct A record, allow that old TTL to
expire.

!!! warning "Avoid repeated redeploys while HTTPS is failing"
    TLS certificate issuance is subject to certificate-authority rate limits.
    A redeploy can request another certificate for the same hostname. Let's
    Encrypt currently permits five certificates for the same exact set of
    hostnames in seven days, refilling one every 34 hours. If DNS resolves but
    HTTPS certificate setup fails, stop redeploying, check the
    [host Caddy logs](../reference/debug-enclave/running.md#inspect-enclave-startup)
    if debug access is already enabled, and wait until the reported retry time.
    Revoking old certificates does not reset the limit. See
    [Let's Encrypt rate limits](https://letsencrypt.org/docs/rate-limits/).

## Redeployment, suspension, and destruction

- **Redeploy:** The same app ID keeps the same `DNS target`. If redeployment
  allocates a different Elastic IP, Caution updates the managed A record after
  the new deployment is ready. Your CNAME does not change.
- **Suspend and resume:** Suspension retains the app's Elastic IP. Resumption
  normally reattaches it. If recovery produces a different IP, Caution checks
  readiness before publishing the change.
- **Normal destroy:** Caution deletes the managed A record, waits for Route53 to
  report `INSYNC`, drains the managed record's 60-second TTL, and then performs
  provider teardown, which releases the Elastic IP on success.
- **Failed destroy:** If DNS withdrawal cannot be proved, teardown stops and the
  IP is retained. If later cloud cleanup fails, normal destroy remains retryable.
  `caution apps destroy --force-delete` can mark the app destroyed after safe DNS
  withdrawal even when cloud cleanup fails; an operator must then reconcile
  possible provider leftovers.
- **Customer CNAME after destroy:** Your CNAME is not removed by Caution. It is
  left dangling after permanent destruction until you delete it or point it at
  another target.

## Notes

- TLS certificates are automatically provisioned for the configured custom
  domain.
- Only one custom domain per deployment is currently supported.
- Disable CDN or proxy TLS termination when the selected encryption mode
  requires TLS to terminate within the Caution deployment.
