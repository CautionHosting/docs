---
icon: lucide/server
---

# Managed on-premises

Deploy Caution enclaves in your own AWS infrastructure while Caution handles the build and deployment orchestration.

## Overview

Managed on-premises deployments let you run confidential enclaves in your own AWS account. You run a one-time setup script that creates isolated AWS infrastructure, and a role that can only interact with resources tagged for Caution, then Caution manages deployments within that environment.

**You control:**

- Your AWS account and billing
- Network configuration and VPC
- Where your data resides

**Caution handles:**

- Building your application
- Uploading EIFs to your S3 bucket
- Creating launch templates and orchestrating deployments
- Assigning Elastic IPs for stable addressing

## Setup

### Prerequisites

- Docker
- AWS credentials with admin permissions (used only during setup)

### 1. Run the setup script

```bash
git clone https://github.com/aspect/managed-on-prem-scripts.git
cd managed-on-prem-scripts

docker build -t caution-provisioner-setup .

docker run --rm \
  -e AWS_ACCESS_KEY_ID="your-admin-key" \
  -e AWS_SECRET_ACCESS_KEY="your-admin-secret" \
  -e AWS_REGION="us-west-2" \
  -v "$(pwd)/out:/out" \
  caution-provisioner-setup
```

This creates all required AWS infrastructure and outputs `credentials.json.gpg` to the `out/` directory.

#### Using an existing VPC

To use an existing VPC instead of creating a new one:

```bash
docker run --rm \
  -e AWS_ACCESS_KEY_ID="your-admin-key" \
  -e AWS_SECRET_ACCESS_KEY="your-admin-secret" \
  -e AWS_REGION="us-west-2" \
  -e VPC_ID="vpc-xxxxxxxx" \
  -v "$(pwd)/out:/out" \
  caution-provisioner-setup
```

### 2. Initialize a Managed On-Premises application

Inside of the application repository locally, run the following command with the output from the previous step (found in the `out/` directory):

```bash
caution init --config credentials.json.gpg

```

## What the setup creates

The setup script creates an isolated environment for running enclaves:

| Resource | Purpose |
|----------|---------|
| **VPC** | Dedicated `/16` VPC with public subnets across multiple availability zones, internet gateway, and routing |
| **S3 Bucket** | Stores enclave image files (EIFs). Named `caution-<deployment-id>-images` |
| **EC2 Instance Role** | Allows enclave instances to read EIFs from the S3 bucket |
| **Launch Template** | Preconfigured template for enclave instances |
| **Auto Scaling Group** | Manages enclave instances (starts at 0, Caution scales as needed) |
| **Scoped IAM User** | Credentials for Caution, scoped to only these resources |

## Security model

### Tag-based resource scoping

All resources are tagged with:

```
caution:deployment-id = <deployment-id>
```

The IAM policy uses AWS condition keys to enforce scope:

- `aws:ResourceTag/caution:deployment-id` - For existing resources
- `aws:RequestTag/caution:deployment-id` - For new resources

### What the scoped credentials CAN do

- Read/write EIF images to the deployment's S3 bucket
- Start/stop/terminate EC2 instances with the deployment tag
- Create new instances via the ASG (automatically tagged)
- Manage volumes, security groups, and EIPs with the deployment tag
- Scale the specific Auto Scaling Group
- Create and manage launch template versions

### What the scoped credentials CANNOT do

- Access any resources without the deployment tag
- Access other S3 buckets
- Modify other Auto Scaling Groups or launch templates
- Access resources in other deployments
- Escalate privileges or modify IAM policies
- Access network resources outside the deployment VPC

## Instance types

Caution automatically selects an appropriate Nitro Enclave-compatible instance based on your CPU and memory requirements:

| Instance | vCPUs | Memory | Enclave capacity |
|----------|-------|--------|------------------|
| `m5.xlarge` | 4 | 16 GB | Up to 2 CPUs, 14 GB |
| `m5.2xlarge` | 8 | 32 GB | Up to 6 CPUs, 30 GB |
| `m5.4xlarge` | 16 | 64 GB | Up to 14 CPUs, 62 GB |
| `m5.8xlarge` | 32 | 128 GB | Up to 30 CPUs, 126 GB |

The host instance reserves ~2 vCPUs and ~2 GB memory for the parent instance.

## Maintenance

### Updating IAM policy

To update the IAM policy for an existing deployment (e.g., after script improvements):

```bash
docker run --rm \
  -e AWS_ACCESS_KEY_ID="your-admin-key" \
  -e AWS_SECRET_ACCESS_KEY="your-admin-secret" \
  -e AWS_REGION="us-west-2" \
  -e DEPLOYMENT_ID="your-deployment-id" \
  -e VPC_ID="vpc-xxxxxxxx" \
  caution-provisioner-setup python setup.py --update-policy
```

### Cleanup

To remove all resources created by the setup, see the cleanup instructions in the [managed-on-prem-scripts repository](https://codeberg.org/caution/managed-on-prem-scripts).

