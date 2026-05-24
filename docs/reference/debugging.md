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
ports: 3000
```

Use the port your application listens on; `3000` is only a placeholder.

Debug mode passes `--debug-mode` to `nitro-cli run-enclave`, which allows you to read the enclave's console output. The tradeoff is that AWS zeros out all PCR values in debug mode, so `caution verify` will refuse to attest the enclave. **Do not use debug mode in production.**

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

# Vsock proxy status (bridges host ports to enclave; replace 3000 with your app port)
sudo systemctl status vsock-proxy-3000.service

# Network proxy (provides enclave internet access)
sudo systemctl status vsock-network.service

# TLS termination
sudo systemctl status caddy.service
sudo journalctl -u caddy.service --no-pager -n 50

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
sudo systemctl status vsock-proxy-3000.service

# Network proxy (provides enclave internet access)
sudo systemctl status vsock-network.service

# TLS termination
sudo systemctl status caddy.service
sudo journalctl -u caddy.service --no-pager -n 50
```

These examples use port `3000`. If your `Procfile` uses a different value in `ports`, replace `3000` with that port.

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

## Test locally with QEMU

For a faster debugging loop, you can boot the same kernel and initramfs inputs locally with QEMU instead of deploying to AWS each time. First, build the enclave image:

```bash
caution apps build
```

This outputs the EIF path and a build directory you can inspect. The build directory contains an `eif-stage/output/` directory with:

```text
enclave.eif
enclave.pcrs
rootfs.cpio.gz
```

Use `rootfs.cpio.gz` as the QEMU initrd. Do not pass the EIF itself to `-initrd`; the EIF is the Nitro package produced by `eif_build`, while QEMU expects a raw initramfs.

The Nitro kernel is not built by `caution apps build`. It comes from the pinned StageX `linux-nitro` image used by the generated `Containerfile.eif`:

```dockerfile
FROM stagex/user-linux-nitro@sha256:aa1006d91a7265b33b86160031daad2fdf54ec2663ed5ccbd312567cc9beff2c AS linux-nitro
COPY --from=linux-nitro /bzImage /build/kernel/bzImage
COPY --from=linux-nitro /linux.config /build/kernel/linux.config
```

Extract the matching kernel from that image:

```bash
mkdir -p /tmp/caution-linux-nitro
docker create --name caution-linux-nitro \
  stagex/user-linux-nitro@sha256:aa1006d91a7265b33b86160031daad2fdf54ec2663ed5ccbd312567cc9beff2c

docker cp caution-linux-nitro:/bzImage /tmp/caution-linux-nitro/bzImage
docker cp caution-linux-nitro:/linux.config /tmp/caution-linux-nitro/linux.config
docker rm caution-linux-nitro
```

Then boot the exported initramfs with QEMU:

```bash
qemu-system-x86_64 \
  -m 512M \
  -nographic \
  -kernel /tmp/caution-linux-nitro/bzImage \
  -initrd /path/to/eif-stage/output/rootfs.cpio.gz \
  -append "console=ttyS0 reboot=k panic=1 pci=off nomodules nit.target=/run.sh"
```

This lets you see boot output and application logs directly in your terminal without needing SSH, debug mode, or a full AWS deployment. Nitro-specific features such as NSM attestation and real enclave vsock behavior are not fully available under plain QEMU, so use this for debugging the initramfs and application boot path rather than validating production attestation.

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

Inspect network and proxy services, and verify the vsock proxy is running for your application port. These examples use port `3000`; if your `Procfile` uses a different value in `ports`, replace `3000` with that port:

```bash
sudo systemctl status vsock-proxy-3000.service
```

If the proxy is running but the app isn't responding, use `sudo nitro-cli console` with debug mode to check whether your application started correctly inside the enclave.

### Attestation fails after debugging

Symptoms include `caution verify` failing with:

> Cannot verify attestation: enclave is in debug mode

Debug mode zeros out PCR values, so attestation cannot be verified while debug mode is enabled.

Clean up debug access, redeploy, and verify again.
