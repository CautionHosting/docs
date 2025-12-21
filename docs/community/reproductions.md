---
icon: lucide/bug-play
---

# Reproductions

When reporting bugs, a minimal reproduction helps us fix issues faster.

## What is a reproduction?

A reproduction is the smallest possible example that demonstrates a bug. It removes all unnecessary code and configuration, leaving only what's needed to trigger the issue.

## Why reproductions matter

- **Faster fixes** - We can immediately see the problem
- **Confirms the bug** - Rules out environment-specific issues
- **Enables testing** - We can verify the fix works

## Creating a reproduction

### Step 1: Start fresh

Create a new, minimal project:

```bash
mkdir bug-reproduction
cd bug-reproduction
caution init
```

### Step 2: Add only what's needed

Include only the code and configuration necessary to trigger the bug. Remove:

- Unrelated features
- Custom configurations (unless relevant)
- Third-party dependencies (unless they cause the bug)

### Step 3: Document steps

Write clear steps to reproduce:

```markdown
1. Clone this repository
2. Run `caution init`
3. Run `caution deploy`
4. Observe error: "..."
```

### Step 4: Verify it reproduces

Before submitting, confirm:

- The bug occurs in your reproduction
- The steps work on a clean environment
- Someone else can follow the steps

## Sharing your reproduction

**Option 1: Git repository**

Push to a public repository and share the link.

**Option 2: Inline code**

For simple cases, include the code directly in the issue:

```markdown
## Procfile
\`\`\`
web: ./app --port $PORT
\`\`\`

## Steps
1. Create the above Procfile
2. Run `caution deploy`
3. Error appears
```

## Tips

- Use default configurations when possible
- Test with the latest Caution version
- Include exact error messages
- Mention your OS and Caution version

## Example reproduction

```
bug-reproduction/
├── Procfile          # Minimal process definition
├── main.go           # Simplest code that triggers bug
└── README.md         # Steps to reproduce
```

A good reproduction saves everyone time and helps us fix bugs faster.
