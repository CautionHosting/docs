---
icon: lucide/git-pull-request-create
---

# Pull requests

Ready to contribute code? Here's how to submit a pull request.

## Before you start

1. **Find or create an issue** - PRs should address a tracked issue
2. **Discuss your approach** - For large changes, get feedback first
3. **Check the roadmap** - Make sure it aligns with project direction

## Setting up

```bash
# Fork and clone the repository
git clone https://codeberg.org/YOUR_USERNAME/platform.git
cd platform

# Add upstream remote
git remote add upstream https://codeberg.org/caution/platform.git

# Create a branch
git checkout -b your-feature-name
```

## Making changes

- **Keep changes focused** - One PR per feature or fix
- **Write tests** - Cover your changes with tests
- **Follow style** - Match the existing code style
- **Update docs** - Document new features or changes

## Commit messages

Use clear, descriptive commit messages:

```
Add verification timeout configuration

- Add --timeout flag to verify command
- Default to 30 seconds
- Document in CLI reference

Fixes #123
```

## Submitting

1. Push your branch to your fork
2. Open a pull request against `main`
3. Fill out the PR template
4. Link the related issue

### PR checklist

- [ ] Tests pass locally
- [ ] Code follows project style
- [ ] Documentation updated (if needed)
- [ ] Commit messages are clear
- [ ] PR description explains changes

## Review process

1. **Automated checks** - CI runs tests and linting
2. **Code review** - Maintainers review your changes
3. **Feedback** - Address any requested changes
4. **Approval** - At least one maintainer approves
5. **Merge** - A maintainer merges your PR

## Tips

- Respond to feedback promptly
- Ask questions if something is unclear
- Be patient - reviews take time
- Small PRs are easier to review

Thank you for contributing!
