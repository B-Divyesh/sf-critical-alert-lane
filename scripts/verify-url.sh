#!/usr/bin/env bash
set -euo pipefail

url="${1:-http://127.0.0.1:4173/}"
html="$(curl --fail --silent --show-error --location "$url")"

require() {
  local pattern="$1"
  local message="$2"
  if ! printf '%s' "$html" | rg -Pq "$pattern"; then
    printf 'FAIL: %s\n' "$message" >&2
    exit 1
  fi
}

require '<html[^>]+lang=' 'missing html lang attribute'
require '<title>[^<]+</title>' 'missing page title'
require '<main(?:\s|>)' 'missing main landmark'
if printf '%s' "$html" | rg -Pi '<img(?![^>]*\balt=)[^>]*>'; then
  printf 'FAIL: image without alt text\n' >&2
  exit 1
fi

printf 'PASS: title, lang, main, and image alt text verified for %s\n' "$url"
