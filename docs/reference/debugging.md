---
icon: lucide/bug
---

# Debug an enclave

<p class="docs-home-intro">Diagnose and fix issues with your enclave deployments.</p>

## Before you start

Make sure:

- Your app is deployed.
- You can redeploy after setting `debug: true` or adding `ssh_keys`.
- You know the public IP address of the EC2 instance running the enclave.
- SSH access is to the **host** EC2 instance, not the enclave itself.

## Enable debug access

Debugging usually requires two separate settings: `debug: true` to read enclave console output, and `ssh_keys` to access the host EC2 instance.

!!! warning "Do not use debug access in production"
    While debug access is enabled, do not send production traffic to the deployment, do not rely on PCR values from that enclave, and do not leave port 22 open longer than needed.

### Enable console output

Add `debug: true` to your `Procfile` to make the enclave console readable:

```yaml
run: /app/server
debug: true
ports: 8083
```

Debug mode passes `--debug-mode` to `nitro-cli run-enclave`, which allows you to read the enclave's console output. The tradeoff is that AWS zeros out all PCR values in debug mode, so `caution verify` will refuse to attest the enclave.

Redeploy after changing `debug` or `ssh_keys` settings.

### Add SSH access to the host

To SSH into the EC2 instance running the enclave, add your public key to the `Procfile`:

```yaml
run: /app/server
debug: true
ssh_keys: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample... user@host
```

The key must be a full OpenSSH public key string starting with `ssh-ed25519`, `ssh-rsa`, `ecdsa-sha2-nistp256`, or similar. To add multiple keys, repeat the `ssh_keys` field:

```yaml
ssh_keys: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFirst... user1@host
ssh_keys: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAISecond... user2@host
```

Adding `ssh_keys` automatically opens port 22 in the instance's security group.

!!! danger "Do not leave SSH enabled in production"
    SSH access and debug mode should only be used during development and testing. Before deploying to production, remove both `ssh_keys` and `debug: true` from your `Procfile`. Leaving SSH open exposes port 22 to the internet, and debug mode disables attestation verification. Both reduce the overall security of the system.

## Connect to the host

After redeploying with `ssh_keys`, connect to the EC2 instance:

```bash
ssh ec2-user@<instance-ip>
```

!!! note "Host access only"
    SSH access is to the **host** EC2 instance, not the enclave itself. The enclave runs in an isolated VM. From the host you can inspect the enclave's state using `nitro-cli` commands.

## Inspect enclave startup

From the SSH session, check whether the enclave is running and inspect startup logs:

```bash
# Find the enclave ID
ENCLAVE_ID=$(sudo nitro-cli describe-enclaves | grep -o '"EnclaveID": "[^"]*"' | cut -d'"' -f4 | head -1)

# Is the enclave running?
sudo nitro-cli describe-enclaves

# Enclave service logs
sudo journalctl -u nitro-enclave.service --no-pager -n 100

# Nitro CLI logs (enclave startup errors, resource allocation failures)
sudo cat /var/log/nitro_enclaves/nitro_enclaves.log

# Full boot log (instance provisioning, EIF download, service setup)
sudo cat /var/log/user-data.log
```

!!! note "AWS Nitro service names"
    These service names apply to Caution deployments on AWS Nitro Enclaves.

## Read enclave console output

If debug mode is enabled, stream the enclave's stdout/stderr:

```bash
sudo nitro-cli console --enclave-id "$ENCLAVE_ID"
```

This only works when `debug: true` is set in the `Procfile`. In production mode, the console is not accessible.

## Inspect network and proxy services

Check the host-side services that connect traffic to the enclave:

```bash
# Vsock proxy status (bridges host ports to enclave)
sudo systemctl status vsock-proxy-<port>.service

# Network proxy (provides enclave internet access)
sudo systemctl status vsock-network.service

# TLS termination
sudo systemctl status caddy.service
sudo journalctl -u caddy.service --no-pager -n 50
```

Replace `<port>` with the application port from your `Procfile`.

## Clean up debug access

Before returning the app to production, remove debug access from the `Procfile`:

```yaml
debug: false
# Remove ssh_keys
```

Redeploy after removing debug access, then run:

```bash
caution verify
```

Verification should only be run against a production-mode enclave. Debug mode zeros out PCR values, so `caution verify` will fail while debug mode is enabled.

## Common issues

### Enclave won't start

Symptoms include the app never becoming reachable, `nitro-cli describe-enclaves` showing no running enclave, or `nitro-enclave.service` restarting repeatedly.

Inspect enclave startup and check the allocator service:

```bash
sudo systemctl status nitro-enclaves-allocator.service
sudo journalctl -u nitro-enclave.service --no-pager
```

Common causes include insufficient memory or CPU allocation, or the EIF failing to download from S3.

### Application is unreachable

Symptoms include connection timeouts, failed health checks, or Caddy returning an upstream or proxy error.

Inspect network and proxy services, and verify the vsock proxy is running for your application port:

```bash
sudo systemctl status vsock-proxy-<port>.service
```

If the proxy is running but the app isn't responding, use `sudo nitro-cli console` with debug mode to check whether your application started correctly inside the enclave.

### Attestation fails after debugging

Symptoms include `caution verify` failing with:

> Cannot verify attestation: enclave is in debug mode

Debug mode zeros out PCR values, so attestation cannot be verified while debug mode is enabled.

Clean up debug access, redeploy, and verify again.
