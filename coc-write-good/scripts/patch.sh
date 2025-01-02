#!/usr/bin/env bash
set -e
cd "$(dirname "$(dirname "$(readlink -f "$0")")")"

for file; do
  scripts/patch.pl "$file" | cpp -DHAVE_COC_NVIM -nostdinc -P -C -o"${file#*/}"
done