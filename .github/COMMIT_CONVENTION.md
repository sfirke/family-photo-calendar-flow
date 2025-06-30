
# Conventional Commits

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such as documentation generation
- **ci**: Changes to CI configuration files and scripts
- **perf**: A code change that improves performance
- **revert**: Reverts a previous commit

## Examples

### Feature
```
feat: add chronological sorting for calendar events

Implements sorting algorithm that places all-day events first,
followed by timed events in chronological order.

Closes #123
```

### Bug Fix
```
fix: resolve time parsing issue in TimelineView

Fixed issue where 12-hour time format wasn't being parsed correctly,
causing events to appear in wrong order.
```

### Breaking Change
```
feat!: change event sorting API

BREAKING CHANGE: The sortEvents function now requires a second parameter
for sort direction. Update all calls to include direction parameter.
```

### With Scope
```
feat(calendar): add week view navigation
fix(ui): correct button hover states
docs(readme): update installation instructions
```

## Automated Version Bumping

Based on commit types:
- `fix:` → patch version (1.0.1)
- `feat:` → minor version (1.1.0)  
- `feat!:` or `BREAKING CHANGE:` → major version (2.0.0)

## Release Notes Generation

Commits are automatically categorized in release notes:
- 🚀 **Features** (`feat:`)
- 🐛 **Bug Fixes** (`fix:`)
- 💥 **Breaking Changes** (`feat!:` or `BREAKING CHANGE:`)
- 📚 **Documentation** (`docs:`)
- 🎨 **Styling** (`style:`)
- ♻️ **Refactoring** (`refactor:`)
- ✅ **Tests** (`test:`)
- 🔧 **Chores** (`chore:`)

## Skipping Releases

Add `[skip-release]` to commit message to prevent automatic releases:
```
docs: update README [skip-release]
```

## Tools

- **Commitlint**: Validates commit messages locally and in CI
- **Husky**: Git hooks for local validation
- **GitHub Actions**: Automated releases based on conventional commits
