#!/usr/bin/env bash
# Ink — Liquid Glass Blog · local launcher (macOS / Linux)
set -e

cd "$(dirname "$0")"

cyan='\033[36m'; bold='\033[1m'; reset='\033[0m'; red='\033[31m'

printf "\n${cyan}${bold}Ink · Liquid Glass Blog${reset}\n"
printf "${cyan}Local launcher${reset}\n\n"

if ! command -v node >/dev/null 2>&1; then
  printf "${red}✗ Node.js is not installed or not on PATH.${reset}\n"
  printf "  Download from https://nodejs.org/  (LTS, 20+)\n\n"
  exit 1
fi

exec npm run launch
