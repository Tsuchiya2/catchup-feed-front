# Versioning Guide

This project follows [Semantic Versioning](https://semver.org/) (SemVer) starting from v1.0.0.

## Version Format

```
v{MAJOR}.{MINOR}.{PATCH}
```

- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes, maintenance, improvements (backwards compatible)

## Branch Naming Convention

Branch names determine which version number gets bumped:

| Branch Prefix | Version Bump | Example | Description |
|--------------|--------------|---------|-------------|
| `feat/` | **MINOR** | v1.0.0 → v1.1.0 | New features |
| `feature/` | **MINOR** | v1.0.0 → v1.1.0 | New features (alias) |
| `fix/` | **PATCH** | v1.0.0 → v1.0.1 | Bug fixes |
| `hotfix/` | **PATCH** | v1.0.0 → v1.0.1 | Urgent bug fixes |
| `chore/` | **PATCH** | v1.0.0 → v1.0.1 | Maintenance, refactoring |
| `docs/` | **PATCH** | v1.0.0 → v1.0.1 | Documentation only |
| `perf/` | **PATCH** | v1.0.0 → v1.0.1 | Performance improvements |
| `refactor/` | **PATCH** | v1.0.0 → v1.0.1 | Code refactoring |
| `test/` | **PATCH** | v1.0.0 → v1.0.1 | Test improvements |
| `breaking/` | **MAJOR** | v1.0.0 → v2.0.0 | Breaking changes |
| `major/` | **MAJOR** | v1.0.0 → v2.0.0 | Major version bump |

## Examples

### Adding a new feature
```bash
git checkout -b feat/user-notifications
# After merge: v1.2.0 → v1.3.0
```

### Fixing a bug
```bash
git checkout -b fix/login-redirect-issue
# After merge: v1.2.0 → v1.2.1
```

### Maintenance/Chores
```bash
git checkout -b chore/update-dependencies
# After merge: v1.2.0 → v1.2.1
```

### Breaking changes
```bash
git checkout -b breaking/api-v2-migration
# After merge: v1.2.0 → v2.0.0
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description | Version Bump |
|------|-------------|--------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `chore` | Maintenance | PATCH |
| `docs` | Documentation | PATCH |
| `perf` | Performance | PATCH |
| `refactor` | Refactoring | PATCH |
| `test` | Testing | PATCH |
| `breaking` | Breaking change | MAJOR |

### Breaking Changes

To indicate a breaking change, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```bash
# Option 1: Using !
feat!: change authentication API response format

# Option 2: Using footer
feat: change authentication API response format

BREAKING CHANGE: The auth response now returns `accessToken` instead of `token`
```

## Release Process

1. **Create branch** with appropriate prefix
2. **Make changes** and commit following conventional commits
3. **Create PR** to `main` branch
4. **Merge PR** after review
5. **Create release** with appropriate version bump based on branch prefix

### Creating a Release

```bash
# Get current version
git describe --tags --abbrev=0

# Create and push new tag
git tag v1.x.y
git push origin v1.x.y

# Create GitHub release
gh release create v1.x.y --generate-notes
```

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v1.0.0 | 2025-12-15 | First stable release |
| v0.x.x | 2025-12-07 ~ 2025-12-14 | Pre-release development |
