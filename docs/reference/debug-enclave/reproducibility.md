---
icon: lucide/refresh-cw
---

# Debug Enclave Reproducibility

<p class="docs-home-intro">Compare a deployed enclave's filesystem against a local build to diagnose reproducibility issues.</p>

## Overview

Enclave reproducibility means the same source always produces the same Enclave Image File (EIF). Caution uses [StageX](https://codeberg.org/stagex) deterministic builds to achieve this. When `caution verify` fails unexpectedly, or you want to confirm that a deployed enclave matches your local build, compare the actual filesystems side by side.

## Compare filesystems

### 1. Build the enclave image locally

```bash
caution apps build
```

The output directory contains:

```text
eif-stage/output/
├── enclave.eif       # The enclave image file
├── enclave.pcrs      # PCR measurements
└── rootfs.cpio.gz    # Raw initramfs (for local QEMU testing)
```

### 2. Download the deployed EIF

```bash
caution apps download-eif
```

This downloads the EIF that is currently deployed on your Caution instance.

### 3. Extract both filesystems

Create temporary directories for the extraction and find the second gzip entry offset in each EIF using `binwalk`:

```bash
mkdir /tmp/local-extract /tmp/deployed-extract
binwalk enclave.eif
```

Look for the second gzip entry in the output and note its offset. Then extract using that offset into the appropriate directory:

```bash
cd /tmp/local-extract
dd if=/path/to/enclave.eif bs=1 skip=<offset> | zcat | cpio --no-absolute-filenames -idmv

cd /tmp/deployed-extract
dd if=/path/to/downloaded.eif bs=1 skip=<offset> | zcat | cpio --no-absolute-filenames -idmv
```

### 4. Compare with diffoscope

```bash
diffoscope /path/to/local-extract/ /path/to/downloaded-extract/
```

diffoscope produces a detailed HTML report showing every difference between the two filesystems — file additions, removals, content changes, permission differences, and more.

## Diagnose differences

### Non-deterministic build inputs

If your Containerfile or application build pulls from un-pinned sources (e.g. `apt-get update` without locking versions, `go build` without a `go.sum`, or `pip install` without a lockfile), the resulting filesystem may differ between builds.

**Fix:** Pin all dependencies to specific versions or digests. StageX base images are already pinned - ensure the same for application-layer dependencies.

### Timestamps or build metadata

Build tools that embed timestamps, build IDs, or hostnames produce non-reproducible EIFs.

**Fix:** Use `SOURCE_DATE_EPOCH` or equivalent to zero out timestamps. StageX handles kernel and base image reproducibility; your application build must do the same.

### Differing StageX image digests

The generated `Containerfile.eif` pins StageX images by digest. If these digests change between builds (e.g. because you regenerated the Containerfile), the EIFs will differ.

**Fix:** Commit the generated `Containerfile.eif` to your repository so that the pinned digests are version-controlled.

## Also see

- [StageX reproducibility documentation](https://codeberg.org/stagex)
- [Concepts: Reproducibility](../../concepts/reproducibility.md)
- [Concepts: Verifiability](../../concepts/verifiability.md)
