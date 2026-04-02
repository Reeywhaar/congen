#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

OUTPUT="$REPO_ROOT/build/server"

cd "$REPO_ROOT"

echo "Building server..."
GOOS=${GOOS:-linux} GOARCH=${GOARCH:-amd64} \
  go build -o "$OUTPUT" ./server/
echo "Done: $OUTPUT"
