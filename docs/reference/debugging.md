---
icon: lucide/bug
---

# Debugging enclaves

How to diagnose and fix issues with your enclave deployment.

## Enable debug mode

Add `debug: true` to your Procfile:

```
run: /app/server
debug: true
ports: 8083
```

Debug mode passes `--debug-mode` to `nitro-cli run-enclave`, which allows you to read the enclave's console output. The tradeoff is that AWS zeros out all PCR values in debug mode, so `caution verify` will refuse to attest the enclave. **Do not use debug mode in production.**

## Add SSH access to the host

To SSH into the EC2 instance running the enclave, add your public key to the Procfile:

```
run: /app/server
debug: true
ssh_keys: ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample... user@host
```

The key must be a full OpenSSH public key string starting with `ssh-ed25519`, `ssh-rsa`, `ecdsa-sha2-nistp256`, or similar. Multiple keys can be specified:

```
ssh_keys: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFirst... user1@host", "ssh-ed25519..."
```

Adding `ssh_keys` automatically opens port 22 in the instance's security group. Connect with:

```bash
ssh ec2-user@<instance-ip>
```

!!! danger "Do not leave SSH enabled in production"
    SSH access and debug mode should only be used during development and testing. Before deploying to production, remove both `ssh_keys` and `debug: true` from your Procfile. Leaving SSH open exposes port 22 to the internet, and debug mode disables attestation verification. Both reduce the overall security of the system.

!!! note
    SSH access is to the **host** EC2 instance, not the enclave itself. The enclave runs in an isolated VM. From the host you can inspect the enclave's state using `nitro-cli` commands.

## Read enclave console output

Once SSH'd into the host, read the enclave's stdout/stderr:

```bash
# Find the enclave ID
ENCLAVE_ID=$(nitro-cli describe-enclaves | grep -o '"EnclaveID": "[^"]*"' | cut -d'"' -f4)

# Stream console output (requires debug mode)
nitro-cli console --enclave-id "$ENCLAVE_ID"
```

This only works when `debug: true` is set in the Procfile. In production mode, the console is not accessible.

## Check host-side services

From the SSH session, inspect the services that support the enclave:

```bash
# Is the enclave running?
nitro-cli describe-enclaves

# Enclave service logs
journalctl -u nitro-enclave.service --no-pager -n 100

# Vsock proxy status (bridges host ports to enclave)
systemctl status vsock-proxy-8083.service

# Network proxy (provides enclave internet access)
systemctl status vsock-network.service

# TLS termination
systemctl status caddy.service
journalctl -u caddy.service --no-pager -n 50

# Nitro CLI logs (enclave startup errors, resource allocation failures)
cat /var/log/nitro_enclaves/nitro_enclaves.log

# Full boot log (instance provisioning, EIF download, service setup)
cat /var/log/user-data.log
```

## Test locally with QEMU

For a faster debugging loop, you can run the EIF image locally with QEMU instead of deploying to AWS each time. First, build the enclave image:

```bash
caution apps build
```

This outputs the EIF path and a build directory you can inspect. Run the EIF locally with QEMU:

```bash
qemu-system-x86_64 \
  -m 512M \
  -nographic \
  -kernel /path/to/bzImage \
  -initrd /path/to/enclave.eif \
  -append "console=ttyS0"
```

This lets you see boot output and application logs directly in your terminal without needing SSH, debug mode, or a full AWS deployment. Iterate on your Containerfile and Procfile locally, then deploy once things work.

## Common issues

### Enclave won't start

Check the allocator and enclave service:

```bash
systemctl status nitro-enclaves-allocator.service
journalctl -u nitro-enclave.service --no-pager
```

Common causes: insufficient memory/CPU allocation, or the EIF failed to download from S3.

### Application is unreachable

Verify the vsock proxy is running for your port:

```bash
systemctl status vsock-proxy-<port>.service
```

If the proxy is running but the app isn't responding, use `nitro-cli console` (with debug mode) to check if your application started correctly inside the enclave.

### Attestation fails after debugging

Debug mode zeros out PCR values, so `caution verify` will fail with:

> Cannot verify attestation: enclave is in debug mode

Remove `debug: true` and `ssh_keys` from your Procfile and redeploy to restore attestation and close the SSH port.
