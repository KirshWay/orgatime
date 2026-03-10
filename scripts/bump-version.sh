#!/usr/bin/env bash
set -euo pipefail

LEVEL="${1:-}"

if [[ "$LEVEL" != "patch" && "$LEVEL" != "minor" && "$LEVEL" != "major" ]]; then
  echo "Usage: bash scripts/bump-version.sh <patch|minor|major>"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash changes first."
  exit 1
fi

npm version "$LEVEL" --no-git-tag-version --prefix client
npm version "$LEVEL" --no-git-tag-version --prefix server

VERSION=$(node -p "require('./client/package.json').version")

git add -A
git commit -m "chore(version): bump to $VERSION"
git tag "v$VERSION"
git push --follow-tags
