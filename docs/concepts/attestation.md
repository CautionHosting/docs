---
icon: lucide/fingerprint
---

# Attestation

The backbone of confidential compute are hardware trust anchors which offer both mechanisms to isolate workloads and encrypt memory as well as protected private keys which can be used to attest to (vouch for) what's running inside of a confidential compute workload.

Different hardware, such as Intel TDX, AMD SEV-SNP, TPM 2.0, Nitro, all provide attestation capabilities, where they can measure the state of a server and provide *cryptographic signatures* of hashes of said data - this is what "attestations" are. They are also referred to as *cryptographic remote attestations*.

## Multi-hardware attestation

### The problem

Most solutions today are based on a single confidential compute technology. Using confidential compute is a good upgrade over standard ways to run software, but it roots trust in a single manufacturer which provides the confidential compute technology. As all companies, large manufacturers are susceptible to bugs and compromise. By rooting the trust in only one piece of hardware, users of this technology expose themselves to single points of failure (SPOFs).

### The solution - multi-hardware

To address this failure of rooting all trust in a single hardware, along with its inherited risks that span the software, firmware and hardware supply chains, operational practices and all other risks stemming from the organization which creates a confidential compute, the team behind Caution designed [EnclaveOS](https://git.distrust.co/enclaveos). 

This OS is designed to leverage multiple different attestation technologies for a single workload, requiring them all to agree on the current state of the confidential compute workload in order to consider its integrity to be intact. This distribution of trust on the hardware level is unique to Caution and EnclaveOS as of writing of this document.

## Learn more

Our sister company [Distrust](https://distrust.co) published a [blog](https://distrust.co/blog/enclaveos.html) about the details of EnclaveOS which can provide the reader with more technical details around how it works.