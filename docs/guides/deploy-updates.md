---
icon: lucide/refresh-cw
---

# Deploy and roll back updates

<p class="docs-home-intro">Push a new version beside the live one, verify it, then switch traffic to it with a passkey. The previous version keeps running, so rolling back is one more switch.</p>

!!! note "Check your app's lifecycle"
    This guide applies to apps on the `deployments` lifecycle. Availability for new
    managed and BYOC apps depends on separate operator rollout settings. Legacy apps
    retain single-deployment replacement behavior; see [Rules and limits](#rules-and-limits).

An accepted, changed single-branch push creates a deployment on its own instance
(a blue-green deployment). The app's stable IP, and with it its DNS target and your
CNAME, points to one deployment at a time: the live one.

```text
api.yourdomain.com → <app-id>.apps.caution.sh → 198.51.100.20 (stable IP)
                                                      │
    2b6e8c92  Live       a41f0d2  ◄───────────────────┘   serves traffic
    7f3a91c2  Candidate  c93be17  203.0.113.9             runs beside it
```

## 1. Push a candidate

```sh
git push caution main
```

When no deployment is live, successful platform startup activates the new deployment
automatically. Otherwise it stays a candidate on its own IP while the live deployment
keeps serving. An unchanged push does not create another deployment while one is
live; pushes that update multiple branches do not trigger deployment.

```text
Candidate deployment: 7f3a91c2-5d0e-4c1a-9b7e-0d2f6e4a8c11
Candidate endpoint: http://203.0.113.9
Live deployment: 2b6e8c92-1f4a-4e0b-8d3c-5a9e7b6c2d10 (unchanged)

Next:
  caution verify -d 7f3a91c2-5d0e-4c1a-9b7e-0d2f6e4a8c11
  caution apps switch -d 7f3a91c2-5d0e-4c1a-9b7e-0d2f6e4a8c11
```

Test the candidate at its endpoint before you switch. `Running` and platform health
checks do not establish trusted PCRs, secret release, application readiness or TLS
readiness. Complete the verification and unlock steps below, then exercise the
application through its configured transport.

## 2. Check its status

=== "CLI"

    ```sh
    caution apps get
    ```

    ```text
    App: payments-api (<app-id>)          State: Running
    Hostname: <app-id>.apps.caution.sh    Public IP: 198.51.100.20
    Live: 2b6e8c92 · a41f0d2              Candidates: 1 / 3

    DEPLOYMENT  ROLE       COMMIT   PUSHED REF  STATE    SUBJECT
    2b6e8c92    Live       a41f0d2  main        Running  Add rate limits
    7f3a91c2    Candidate  c93be17  main        Running  Cache sessions

    Recent history:
      2026-10-14 09:12  switch 1e0c4b7a → 2b6e8c92  succeeded  alice (passkey)
    ```

    `caution apps get -d 7f3a91c2` shows one deployment: its commit, public IP,
    instance and state.

=== "Dashboard"

    Open the app. **Deployments** lists the live deployment first; select one for its
    details, verification command and actions. **History** shows recorded switch and
    destroy operations and their approvers; rejected requests need not appear there.

`-d` takes the full ID or its first 8 or more characters, as tables print them.
Outside a linked checkout, use the full ID. `caution apps list --all` includes inactive
apps; a deployment table shows retained deployments, not a complete historical inventory.

## 3. Verify it

From a checkout of the app:

```sh
caution verify -d 7f3a91c2
```

```text
✓ Attestation verification PASSED
Trusted state: .caution/deployments/7f3a91c2-5d0e-4c1a-9b7e-0d2f6e4a8c11/trusted_hashes.json
```

The CLI reproduces the candidate's commit and checks the candidate at its own
address. Commit its trust file with your other `.caution/` files. While several
deployments run, `caution verify` without `-d` refuses.

## 4. Release secrets

Skip this step if the app has no [encrypted secrets](add-encrypted-secrets.md). The
candidate starts locked. Each holder releases a share to it before you switch:

```sh
caution secret send-shard -d 7f3a91c2
```

`send-shard -d` checks the candidate against the trust saved by `verify -d` and
requires a bundle matching its recorded bundle hash. It selects a matching local or
organization-stored bundle; it does not retrieve one from Git. Preserve the bundle
for each retained deployment and pass `--bundle` when needed. The approval page
names the deployment.

## 5. Switch live

=== "CLI"

    ```sh
    caution apps switch -d 7f3a91c2
    ```

    ```text
    About to make a deployment live:
      App: <app-id> (payments-api)
      Current live deployment: 2b6e8c92-1f4a-4e0b-8d3c-5a9e7b6c2d10
      Target deployment: 7f3a91c2-5d0e-4c1a-9b7e-0d2f6e4a8c11
      Commit: c93be17e2a94f1d06b8c53a7e41f9d2b08c6a315 Cache sessions
      Stable IP: 198.51.100.20
      The previous deployment stays running and billable.

    Confirm you verified and tested this deployment [y/N] y
    Deployment 7f3a91c2-5d0e-4c1a-9b7e-0d2f6e4a8c11 is now live
    Stable IP: 198.51.100.20
    ```

    Touch your passkey when prompted.

=== "Dashboard"

    Select the candidate, click **Switch live**, check **I verified and tested**, then
    **Approve with passkey**.

The switch moves the stable IP, so the DNS target and your CNAME don't change. Open
connections to the previous deployment may drop. A switch always needs a passkey and
has no `--this-is-a-ci-machine` form. If someone else switched meanwhile, it is
refused: check `caution apps get` and review the new state before retrying.

!!! warning "A timeout does not prove the switch failed"
    The stable IP can move before the request finishes. After a timeout, connection
    loss or server error, refresh the app and its history and check the serving
    endpoint before retrying. Do not assume the previous version is still live.

The verification acknowledgement is your assertion, not proof that the platform
ran local reproduction or tested the application for you.

## Roll back

```sh
caution apps switch -d 2b6e8c92
```

Rollback is a switch to a retained deployment that is still running, healthy and
unlocked. It does not recreate a lost instance, undo database writes or migrations,
or stop background work in the other deployment. Plan compatible data changes and
coordinate workers while versions coexist. An enclave restart requires fresh secret
release; recheck TLS after a restart or rollback.

## Clean up

=== "CLI"

    ```sh
    caution apps destroy -d 2b6e8c92
    ```

    In CI: `caution apps destroy <app-id> -d <deployment-id> --force --this-is-a-ci-machine`.

=== "Dashboard"

    Select the deployment, then **Destroy deployment**.

Every running deployment is billed, candidates and previous ones included. The
dashboard's **Settings** shows the retained instances and their estimated cost. The
live deployment and the actual stable-IP holder cannot be individually destroyed;
busy operations can also block destruction. Failed or cleanup-pending deployments
may keep consuming slots, and surviving instances remain billable until cleanup
finishes. Check the result rather than assuming a destroy request freed the slot.

`caution apps destroy` without `-d` tears down all deployments and app infrastructure,
but retains the app identity, repository, managed hostname and BYOC linkage for
redeployment. It does not migrate the app to a different lifecycle.

## HTTPS certificates

Certificate behavior depends on the HTTP mode:

- **Host TLS, including STEVE's outer HTTPS:** Caddy obtains a configured custom
  domain's certificate on demand and stores it on the host disk. An ordinary host
  reboot does not by itself erase that storage. A fresh host may need new issuance.
- **Attested TLS:** Caddy and certificate storage are inside the enclave. A new or
  restarted enclave may need a new certificate; see below.
- **No custom domain:** the host HTTPS listener uses a self-signed certificate,
  not a publicly trusted custom-domain certificate.

DNS, ACME challenges and rate limits can delay HTTPS after a switch. Do not assume
a fixed wait time or that a switch alone completes certificate issuance.

Let's Encrypt allows five certificates for the same hostname in seven days. Avoid
switching to fresh deployments in quick succession.

### Enclave TLS

With `mode = "tls"`, a never-activated candidate waits until its custom domain
resolves to its own public address before starting enclave Caddy. The startup check
runs on a 15-second loop; certificate issuance then still has to complete. Before
activation, its public platform routes expose `/attestation` and the health check,
not application HTTPS.

1. `caution verify -d` checks the PCRs and reports
   `PCRs verified; application TLS verification pending`.
2. The switch asks you to acknowledge that TLS verification is pending.
3. Once HTTPS answers, run `caution verify -d <deployment>` again to verify the
   certificate binding. Do this after rollback or enclave restart as well; absence
   of the first-activation warning does not prove a certificate is currently usable.

## Rules and limits

- **No live deployment**: successful platform startup activates the next deployment automatically. Otherwise a push creates a candidate, not a replacement.
- **One build at a time**: a push while another builds is refused.
- **Candidates**: the default limit is three, but operators can configure it. Use the displayed limit and wait for cleanup to finish when freeing a slot.
- **Candidate IP**: changes if its instance stops and starts. Commands look it up on
  every run.
- **Debug mode**: follows each deployment's `caution.hcl`. `apps get` shows
  `Running (debug)`, and the switch warns before making it live.
- **Lost instance**: a deployment whose instance is gone shows `Unavailable`. If it
  was live, switch to a healthy deployment, then destroy it.
- **Legacy apps**: `Lifecycle: Legacy · single deployment` means the replacement
  flow still applies. Ordinary destroy/redeploy preserves this lifecycle. Moving
  to blue-green requires a newly created app under the enabled rollout.

For operators, `APP_DEPLOYMENTS_ENABLED=true` selects the lifecycle for new managed
apps and `APP_DEPLOYMENTS_BYOC_ENABLED=true` for new BYOC apps. Both default off.
`MAX_CANDIDATES_PER_APP` controls the candidate limit. Confirm the intended rollout
before advertising blue-green availability; existing apps do not change lifecycle
just because an operator enables a flag.

## Bring your own compute

The same commands work. Each deployment is its own EC2 instance in your AWS account,
tagged with your environment's `caution:deployment-id`; the environment's Auto Scaling
group stays at zero. AWS bills you directly, so no cost estimate is shown.

- An app remains linked to its environment; ordinary teardown retains the BYOC
  linkage. Treat a move to another environment as a separate migration.
- A switch failure before IP movement leaves the current association intact, but
  an ambiguous failure still needs the state checks above.
- Whole-app teardown can withdraw managed DNS before cloud credential checks or
  cleanup fail. Restoring access does not itself prove recovery: retry or reconcile
  the teardown and check DNS and retained resources.

## See also

<div class="grid cards" markdown>

- :lucide-badge-check: **Verify an app**

    ---

    Learn what [`caution verify`](verify-an-app.md) checks.

- :lucide-key-round: **Add encrypted secrets**

    ---

    Release [secrets](add-encrypted-secrets.md) to a verified enclave.

- :lucide-globe: **Set up a custom domain**

    ---

    Point your own [domain name](set-up-a-custom-domain.md) at the stable DNS target.

</div>
