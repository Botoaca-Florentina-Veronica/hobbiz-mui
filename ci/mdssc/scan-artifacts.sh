#!/usr/bin/env bash
# Artifact scan via MDSSC REST API
# Called from Stage 3 in ci/Jenkinsfile when that stage is enabled.
#
# Required env vars (set as Jenkins credentials):
#   MDSSC_API_KEY  – your OPSWAT MetaDefender Supply Chain API key
#   MDSSC_API_URL  – base URL, e.g. https://api.opswat.com/v1
#   BUILD_NUMBER   – injected automatically by Jenkins
#
# Targets:
#   - frontend/dist bundle (archived by Jenkins)
#   - Docker images: hobbiz-backend:$BUILD_NUMBER, hobbiz-frontend:$BUILD_NUMBER
#
# Reference: https://www.opswat.com/docs/supply-chain/metadefender-software-supply-chain-api-3.3.0
# CLI docs:  https://www.opswat.com/docs/supply-chain/operating/cli-scanner

set -euo pipefail

: "${MDSSC_API_KEY:?MDSSC_API_KEY is not set}"
: "${MDSSC_API_URL:?MDSSC_API_URL is not set}"
: "${BUILD_NUMBER:?BUILD_NUMBER is not set}"

echo "TODO: implement artifact scan"
# Example – scan the frontend dist bundle:
#   tar czf dist.tar.gz -C frontend dist
#   mdssc scan --path dist.tar.gz --apikey "$MDSSC_API_KEY" --fail-on-threat
#
# Example – scan a Docker image (save to tar, then scan):
#   docker save "hobbiz-backend:$BUILD_NUMBER" | gzip > backend-image.tar.gz
#   mdssc scan --path backend-image.tar.gz --apikey "$MDSSC_API_KEY" --fail-on-threat
