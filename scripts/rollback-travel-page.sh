#!/usr/bin/env bash
set -euo pipefail

version="${1:-}"
target_path="t/2026-austria-czech-7f4c9b2e6a31d8"

case "$version" in
  8 | v8)
    commit="8bf7510"
    ;;
  7 | v7)
    commit="6d5aad2"
    ;;
  6 | v6)
    commit="cfbd56c"
    ;;
  *)
    echo "Usage: $0 8|7|6" >&2
    exit 1
    ;;
esac

git checkout "$commit" -- "$target_path"

echo "Restored $target_path to version $version from $commit."
echo "Review the change, then run:"
echo "  git add $target_path"
echo "  git commit -m 'Rollback travel page to version $version'"
echo "  git push origin main"
