#!/usr/bin/env bash
# Install the packed tarball into a consumer fixture, compile use.ts with the given TypeScript, run it.
# Usage: compat/run.sh <cjs|esm> <typescript-version> <path-to-tarball>
set -euo pipefail

fixture="$1"; ts="$2"; tarball="$(cd "$(dirname "$3")" && pwd)/$(basename "$3")"
dir="$(cd "$(dirname "$0")/$fixture" && pwd)"

cp "$(dirname "$0")/use.ts" "$dir/use.ts"
cd "$dir"
npm install --silent --no-save --no-package-lock "$tarball" "typescript@$ts" >/dev/null
npx tsc -p .
node out/use.js
