---
icon: lucide/refresh-cw
---

# Deploy and roll back updates

<p class="docs-home-intro">Push a new version beside the live one, verify it, then switch traffic to it with a passkey. The previous version keeps running, so rolling back is one more switch.</p>

Every push creates a new deployment on its own instance (a blue-green deployment).
The app's stable IP, and with it its DNS target and your CNAME, points to one
deployment at a time: the live one.

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

The first push of an app goes live directly. After that, a push creates a candidate:
it runs on its own IP while the live deployment keeps serving.

```text
Candidate deployment: 7f3a91c2-5d0e-4c1a-9b7e-0d2f6e4a8c11
Candidate endpoint: http://203.0.113.9
Live deployment: 2b6e8c92-1f4a-4e0b-8d3c-5a9e7b6c2d10 (unchanged)

Next:
  caution verify -d 7f3a91c2-5d0e-4c1a-9b7e-0d2f6e4a8c11
  caution apps switch -d 7f3a91c2-5d0e-4c1a-9b7e-0d2f6e4a8c11
```

Test the candidate at its endpoint before you switch.

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
    details, verification command and actions. **History** shows every switch and
    destroy, with who approved it.

`-d` takes the full ID or its first 8 or more characters, as tables print them.
Outside a linked checkout, use the full ID.

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

`send-shard -d` checks the candidate against the trust saved by `verify -d` and uses
the quorum bundle committed at the candidate's commit. The approval page names the
deployment. If your image copies its bundle from another path, pass `--bundle`.

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
refused: check `caution apps get` and switch again.

## Roll back

```sh
caution apps switch -d 2b6e8c92
```

The previous deployment is still running, so rolling back is a switch to it.

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
live deployment cannot be destroyed. `caution apps destroy` without `-d` destroys
the app and all its deployments.

## HTTPS certificates

A deployment gets its certificate once it holds the stable IP, so every switch to a
deployment that has never been live issues one. The first HTTPS request after the
switch waits a few seconds for it. Rolling back to a deployment that was live reuses
its certificate, unless its instance restarted.

Let's Encrypt allows five certificates for the same hostname in seven days. Avoid
switching to fresh deployments in quick succession.

### Enclave TLS

With `mode = "tls"`, the certificate is issued inside the enclave, so a candidate has
none before its switch. Its endpoint serves only `/attestation` and the health check.

1. `caution verify -d` checks the PCRs and reports
   `PCRs verified; application TLS verification pending`.
2. The switch asks you to acknowledge that TLS verification is pending.
3. Once HTTPS answers, run `caution verify -d <deployment>` again to verify the
   certificate binding.

## Rules and limits

- **First push**: goes live on its own. Later pushes never replace the live deployment.
- **One build at a time**: a push while another builds is refused.
- **Candidates**: up to three per app (`Candidate limit reached (3 / 3)`). Destroy one
  to push again.
- **Candidate IP**: changes if its instance stops and starts. Commands look it up on
  every run.
- **Debug mode**: follows each deployment's `caution.hcl`. `apps get` shows
  `Running (debug)`, and the switch warns before making it live.
- **Lost instance**: a deployment whose instance is gone shows `Unavailable`. If it
  was live, switch to a healthy deployment, then destroy it.
- **Older apps**: apps created before deployments show
  `Lifecycle: Legacy · single deployment` and replace the running enclave on each
  push. Destroy and recreate one to move it over.

## Bring your own compute

The same commands work. Each deployment is its own EC2 instance in your AWS account,
tagged with your environment's `caution:deployment-id`; the environment's Auto Scaling
group stays at zero. AWS bills you directly, so no cost estimate is shown.

- An app stays in the environment and region of its first push. Destroy it to move it.
- If Caution loses access to your account, switches and destroys fail without changing
  anything, and resume once access returns.

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
