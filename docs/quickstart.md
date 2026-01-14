---
icon: lucide/zap
---

# Quickstart

The quickest way to deploy an application using Caution. It takes 8 minutes.

## Requirements

1. An application which is containerized using [Docker](https://www.docker.com/).

2. A Linux system based on x86_64 architecture

3. Smart card (Yubikey, NitroKey, LibremKey etc.)

## Create an account

1. Go to [https://alpha.caution.co](https://alpha.caution.co/)
2. Enter your alpha code (if you do not have one, send an email to `info at caution dot co`)
3. Plug in your smart card
4. Click "Continue"
4. Tap your smart card when it blinks

## CLI Installation

=== ":fontawesome-brands-linux: Linux"

    Open a terminal and run the install script:

    ```bash
    curl -fsSL https://codeberg.org/caution/cli/raw/branch/main/install.sh | sh
    ```

=== ":fontawesome-brands-apple: macOS"
    Coming soon.

=== ":fontawesome-brands-windows: Windows"
    Coming soon.

### Add an SSH key

```bash
caution ssh-keys add --from-agent
```

### Select an application to deploy

Use `git` to clone a containerized application. You can use the Caution `hello-world-enclave` app:

```bash
git clone https://codeberg.org/caution/demo-hello-world-enclave.git
```

### Initialize the application

1. Ensure you are inside of the application repository you are deploying. If you used the `hello-world-enclave` app in the previous step:

```bash
cd hello-world-enclave
```

2. Use the initialization command:

```bash
caution init
```

This command typically creates the `Procfile` which at a minimum needs to have a `run` field which tells Caution how to run your application, as well as `ports` in order to expose the necessary ports. The `hello-world-enclave` already has the `Procfile` set up with a `run` command, take a look!

### Deploy

You are ready to deploy. Push the code to Caution:

```bash
git push caution main
```

### Verify the deployment

Once the deployment is complete, you can verify it:

```bash
caution verify
```

## Next steps

<div class="grid cards" markdown>

- :lucide-shield-check: **[Verifiability](concepts/verifiability.md)**

  Learn how Caution proves what code is running.

- :lucide-lock: **[Encryption](concepts/encryption.md)**

  Understand end-to-end encryption with STEVE.

- :lucide-file-code: **[Procfile reference](reference/procfile.md)**

  Configure your application deployment.

</div>
