---
icon: lucide/bug
---

# Bug reports

Found a bug? Help us fix it by submitting a clear bug report.

## Before reporting

1. **Search existing issues** - Your bug may already be reported
2. **Update to the latest version** - The bug may be fixed
3. **Check the documentation** - It might be expected behavior

## How to report

Create an issue at [codeberg.org/caution/platform/issues](https://codeberg.org/caution/platform/issues) with:

### Required information

- **Title** - A clear, descriptive summary
- **Description** - What happened vs. what you expected
- **Steps to reproduce** - Minimal steps to trigger the bug
- **Environment** - OS, Caution version, relevant configuration

### Example

```markdown
## Description
`caution verify` fails with "connection refused" error when verifying
apps deployed to custom domains.

## Steps to reproduce
1. Deploy an app with `git push caution main`
2. Configure a custom domain
3. Run `caution verify --reproduce <app-id>`

## Expected behavior
Verification should complete successfully.

## Actual behavior
Error: "connection refused" after 30 second timeout.

## Environment
- OS: macOS 14.2
- Caution CLI: v0.1.0
- App domain: app.example.com
```

## What happens next

1. A maintainer will triage the issue
2. We may ask for more information
3. The issue will be labeled and prioritized
4. Someone will work on a fix

Thank you for helping improve Caution!
