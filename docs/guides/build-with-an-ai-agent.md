---
icon: lucide/bot
---

# Build with an AI agent

<p class="docs-home-intro">Give your AI coding agent the skills it needs to write a <code>caution.hcl</code>, build reproducible images, and debug enclave deployments.</p>

Caution publishes a set of [agent skills](https://codeberg.org/caution/agentic-skills){:target="_blank"} for [Claude Code](https://claude.com/claude-code){:target="_blank"} and [Codex](https://openai.com/codex){:target="_blank"}. Once installed, your agent knows how to package and debug an app for Caution and StageX without you having to paste in the docs.

Each skill is a `SKILL.md` — the format originated by Anthropic for Claude Code and now also read natively by Codex. Because the content is plain Markdown, it works with any agent: drop it into an `AGENTS.md`, `CLAUDE.md`, or your tool's equivalent if it doesn't support `SKILL.md` directly.

## Skills

### `caution-platform`

Write the Caution `caution.hcl`, and deploy or debug enclave apps locally and on AWS Nitro.

- `caution.hcl` authoring — unit command, container input, ports, resources, features
- Local QEMU debugging on a Linux host, or a Linux amd64 VM on macOS
- Attestation endpoint testing (`/attestation` request format, expected errors)
- Production health check failures, SSH debug mode, vsock and service logs

### `stagex-reproducible-builds`

Reproducible, verifiable container images with [StageX](https://stagex.tools){:target="_blank"}.

- Rust, Go, C/C++ build patterns with full vendoring
- Pallet selection and digest pinning
- `SOURCE_DATE_EPOCH`, `RUN --network=none`, hermetic builds
- The `Containerfile`; PCR reproducibility verification checklist

## Install for Claude Code

```bash
for skill in caution-platform stagex-reproducible-builds; do
  mkdir -p ~/.claude/skills/$skill
  curl -sL https://codeberg.org/caution/agentic-skills/raw/branch/main/$skill/SKILL.md \
    -o ~/.claude/skills/$skill/SKILL.md
done
```

## Install for Codex

Clone the repo, then copy the skill folders into `~/.codex/skills` so Codex can discover both `SKILL.md` and `agents/openai.yaml`:

```bash
git clone https://codeberg.org/caution/agentic-skills.git
cd agentic-skills

for skill in caution-platform stagex-reproducible-builds; do
  mkdir -p ~/.codex/skills/$skill
  cp -R $skill/. ~/.codex/skills/$skill/
done
```

## See also

<div class="grid cards" markdown>

- :lucide-box: **Containerize an app**

    ---

    Build a reproducible image for your [Caution app](containerize-an-application.md).

- :lucide-file-code: **caution.hcl reference**

    ---

    Configure how your application [runs on Caution](../reference/caution-hcl.md).

- :lucide-bug: **Debug an enclave**

    ---

    Diagnose and fix [enclave deployments](../reference/debugging.md).

</div>
