---
icon: lucide/bug
---

# Debug an enclave

<p class="docs-home-intro">Diagnose and fix issues with your enclave deployments.</p>

## Before you start

Make sure:

- Your app is deployed.
- You can redeploy after enabling the `debug` block or adding `ssh_keys`.
- You know the public IP address of the EC2 instance running the enclave.
- SSH access is to the **host** EC2 instance, not the enclave itself.

## Enable debug access

Debugging usually requires two separate settings in the enclave's `debug` block: `enabled = true` to read enclave console output, and `ssh_keys` to access the host EC2 instance.

!!! warning "Do not use debug access in production"
    While debug access is enabled, do not send production traffic to the deployment, do not rely on PCR values from that enclave, and do not leave port 22 open longer than needed.

### Enable console output

Add a `debug` block with `enabled = true` to your `caution.hcl` to make the enclave console readable:

```hcl
enclave "main" {
  debug {
    enabled = true
  }
  unit "default" {
    command = "/app/server"
  }
}
```

Debug mode passes `--debug-mode` to `nitro-cli run-enclave`, which allows you to read the enclave's console output. The tradeoff is that AWS zeros out all PCR values in debug mode, so `caution verify` will refuse to attest the enclave. **Do not use debug mode in production.**

Redeploy after changing the `debug` block.

### Add SSH access to the host

To SSH into the EC2 instance running the enclave, add your public key to the `ssh_keys` list:

```hcl
debug {
  enabled  = true
  ssh_keys = ["ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIExample... user@host"]
}
```

Each key must be a full OpenSSH public key string starting with `ssh-ed25519`, `ssh-rsa`, `ecdsa-sha2-nistp256`, or similar. Add multiple keys as list entries:

```hcl
ssh_keys = [
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFirst... user1@host",
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAISecond... user2@host",
]
```

Adding `ssh_keys` automatically opens port 22 in the instance's security group.

!!! danger "Do not leave SSH enabled in production"
    SSH access and debug mode should only be used during development and testing. Before deploying to production, remove the `debug` block from your `caution.hcl`. Leaving SSH open exposes port 22 to the internet, and debug mode disables attestation verification. Both reduce the overall security of the system.

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

This only works when `debug { enabled = true }` is set in `caution.hcl`. In production mode, the console is not accessible.

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

These examples use port `3000`. If your `caution.hcl` exposes a different `ingress` port, replace `3000` with that port.

## Clean up debug access

Before returning the app to production, remove the `debug` block from `caution.hcl`:

```hcl
# Remove the entire debug { } block, including ssh_keys
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

Two kernel options are available depending on what you need to test.

### Logs only (Nitro kernel)

The Nitro kernel comes from the pinned StageX `linux-nitro` image used by the generated `Containerfile.eif`:

```dockerfile
FROM stagex/user-linux-nitro@sha256:aa1006d91a7265b33b86160031daad2fdf54ec2663ed5ccbd312567cc9beff2c AS linux-nitro
COPY --from=linux-nitro /bzImage /build/kernel/bzImage
COPY --from=linux-nitro /linux.config /build/kernel/linux.config
```

Extract it:

```bash
mkdir -p /tmp/caution-linux-nitro
docker create --name caution-linux-nitro \
  stagex/user-linux-nitro@sha256:aa1006d91a7265b33b86160031daad2fdf54ec2663ed5ccbd312567cc9beff2c

docker cp caution-linux-nitro:/bzImage /tmp/caution-linux-nitro/bzImage
docker cp caution-linux-nitro:/linux.config /tmp/caution-linux-nitro/linux.config
docker rm caution-linux-nitro
```

Boot:

```bash
qemu-system-x86_64 \
  -m 512M \
  -nographic \
  -kernel /tmp/caution-linux-nitro/bzImage \
  -initrd /path/to/eif-stage/output/rootfs.cpio.gz \
  -append "console=ttyS0 reboot=k panic=1 nomodules nit.target=/run.sh"
```

This shows boot output and application logs. Networking will not work — the Nitro kernel has no virtio-net or vsock drivers.

### With networking (standard kernel)

To expose ports and test HTTP endpoints, use a standard x86_64 kernel:

```bash
docker run --rm --platform linux/amd64 \
  -v /tmp/caution-linux-nitro:/out ubuntu:24.04 \
  bash -c "apt-get update -q && apt-get install -y linux-image-generic \
    && chmod 644 /boot/vmlinuz-* \
    && cp /boot/vmlinuz-*-generic /out/vmlinuz-amd64"
```

Boot with port forwarding — adjust ports to match your `caution.hcl`:

```bash
qemu-system-x86_64 \
  -m 512M \
  -nographic \
  -kernel /tmp/caution-linux-nitro/vmlinuz-amd64 \
  -initrd /path/to/eif-stage/output/rootfs.cpio.gz \
  -append "console=ttyS0 reboot=k panic=1 nomodules nit.target=/run.sh" \
  -netdev user,id=net0,hostfwd=tcp:0.0.0.0:8083-:8083,hostfwd=tcp:0.0.0.0:49502-:49502 \
  -device virtio-net-pci,netdev=net0
```

```bash
# App
curl http://localhost:8083/

# Attestation — nonce is base64-encoded 32 bytes
curl -X POST http://localhost:49502/attestation \
  -H "Content-Type: application/json" \
  -d '{"nonce": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="}'
```

Expected attestation response (correct — NSM not available in QEMU):

```json
{"errors":["unable to get nonced attestation: AttestationGeneration (...)","could not initialize the NSM driver"]}
```

Expected warnings that are harmless:

- `socat: TUNSETIFF {"eth0"}: Invalid argument` — vsock TUN creation failed, but virtio-net eth0 still comes up
- `open("/dev/vsock"): No such file or directory` — standard kernel has no vsock driver
- `WARNING: NSM module not found at /nsm.ko` — expected, no hardware

### Local limitations

| Feature | Local QEMU | Production (Nitro) |
|---|---|---|
| App starts, logs visible | Yes | Yes |
| Networking / port access | Standard kernel only | Yes (vsock tunnel) |
| NSM / attestation document | No | Yes |
| VSock proxies | No | Yes |
| PCR measurements | No | Yes |

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

Inspect network and proxy services, and verify the vsock proxy is running for your application port. These examples use port `3000`; if your `caution.hcl` exposes a different `ingress` port, replace `3000` with that port:

```bash
sudo systemctl status vsock-proxy-3000.service
```

If the proxy is running but the app isn't responding, use `sudo nitro-cli console` with debug mode to check whether your application started correctly inside the enclave.

### Attestation fails after debugging

Symptoms include `caution verify` failing with:

> Cannot verify attestation: enclave is in debug mode

Debug mode zeros out PCR values, so attestation cannot be verified while debug mode is enabled.

Clean up debug access, redeploy, and verify again.
