#!/usr/bin/env bash
# Stage 1 – Source-code scan via MDSSC REST API
#
# Flow:
#   1. Archive source code (exclude git/node_modules/dist)
#   2. POST /api/v1/scans/direct  → get scanId
#   3. Poll GET /api/v1/scans/{id}/overview until scanningState is terminal
#   4. Evaluate verdict – fail build on malware / secrets / critical vulns / blocked licenses
#
# Required Jenkins credentials (configure as Secret Text):
#   mdssc-api-url  → exposed as MDSSC_API_URL 
#   mdssc-api-key  → exposed as MDSSC_API_KEY
#
# Optional env vars:
#   MDSSC_WORKFLOW_ID   – specific workflow to use (default: server default)
#   MDSSC_FAIL_ON_HIGH  – "true" to fail on high-severity vulns too (default: critical only)
#   MDSSC_POLL_INTERVAL – seconds between poll attempts (default: 10)
#   MDSSC_POLL_TIMEOUT  – max seconds to wait for scan completion (default: 300)

set -euo pipefail

: "${MDSSC_API_URL:?MDSSC_API_URL is not set — add it as a Jenkins credential}"
: "${MDSSC_API_KEY:?MDSSC_API_KEY is not set — add it as a Jenkins credential}"

POLL_INTERVAL="${MDSSC_POLL_INTERVAL:-10}"
POLL_TIMEOUT="${MDSSC_POLL_TIMEOUT:-300}"
FAIL_ON_HIGH="${MDSSC_FAIL_ON_HIGH:-false}"
ARCHIVE="mdssc-source-scan.tar.gz"

cleanup() { rm -f "$ARCHIVE"; }
trap cleanup EXIT

# ── 1. Archive ────────────────────────────────────────────────────────────────
echo "[MDSSC] Creating source archive..."
tar czf "$ARCHIVE" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='frontend/dist' \
    --exclude='frontend/.vite' \
    --exclude='*.log' \
    --exclude="$ARCHIVE" \
    .
echo "[MDSSC] Archive size: $(du -sh "$ARCHIVE" | cut -f1)"

# ── 2. Upload & start scan ────────────────────────────────────────────────────
echo "[MDSSC] Uploading to ${MDSSC_API_URL}/api/v1/scans/direct ..."

UPLOAD_ARGS=(
    -s
    -X POST
    -H "apikey: ${MDSSC_API_KEY}"
    -F "files=@${ARCHIVE}"
    -w "\nHTTP_STATUS:%{http_code}"
)
[[ -n "${MDSSC_WORKFLOW_ID:-}" ]] && UPLOAD_ARGS+=(-F "workflowId=${MDSSC_WORKFLOW_ID}")

RAW_RESPONSE=$(curl "${UPLOAD_ARGS[@]}" "${MDSSC_API_URL}/api/v1/scans/direct")
HTTP_STATUS=$(echo "$RAW_RESPONSE" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
UPLOAD_RESPONSE=$(echo "$RAW_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "[MDSSC] HTTP status: $HTTP_STATUS"
echo "[MDSSC] Response body: $UPLOAD_RESPONSE"

if [[ "$HTTP_STATUS" != "200" ]]; then
    echo "[MDSSC] ERROR: upload failed with HTTP $HTTP_STATUS — verifică URL-ul și API key-ul"
    exit 1
fi

SCAN_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.scanIds[0] // empty')
if [[ -z "$SCAN_ID" ]]; then
    echo "[MDSSC] ERROR: no scanId returned — check credentials and server URL"
    exit 1
fi
echo "[MDSSC] Scan ID: $SCAN_ID"

# ── 3. Poll until complete ────────────────────────────────────────────────────
echo "[MDSSC] Polling for completion (timeout: ${POLL_TIMEOUT}s, interval: ${POLL_INTERVAL}s)..."
ELAPSED=0
OVERVIEW=""
SCANNING_STATE=""

while true; do
    OVERVIEW=$(curl -sf \
        -H "apikey: ${MDSSC_API_KEY}" \
        "${MDSSC_API_URL}/api/v1/scans/${SCAN_ID}/overview")

    SCANNING_STATE=$(echo "$OVERVIEW" | jq -r '.[0].scanStatus.scanningState // "unknown"')
    SCAN_PROGRESS=$(echo "$OVERVIEW"  | jq -r '.[0].scanStatus.scanProgress  // 0')

    echo "[MDSSC] State: ${SCANNING_STATE} | Progress: ${SCAN_PROGRESS}%"

    case "$SCANNING_STATE" in
        completed|done|finished|failed|error)
            break
            ;;
    esac

    if [[ $ELAPSED -ge $POLL_TIMEOUT ]]; then
        echo "[MDSSC] ERROR: timed out after ${POLL_TIMEOUT}s (last state: ${SCANNING_STATE})"
        exit 1
    fi

    sleep "$POLL_INTERVAL"
    ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

if [[ "$SCANNING_STATE" == "failed" || "$SCANNING_STATE" == "error" ]]; then
    ERRORS=$(echo "$OVERVIEW" | jq -r '.[0].scanInformation.errors[]? // empty' | head -5)
    echo "[MDSSC] ERROR: scan ended in failure — ${ERRORS:-no details}"
    exit 1
fi

# ── 4. Evaluate verdict ───────────────────────────────────────────────────────
MALWARE=$(echo "$OVERVIEW"    | jq -r '.[0].scanInformation.malware                           // false')
SECRETS=$(echo "$OVERVIEW"    | jq -r '.[0].scanInformation.secret                            // false')
CRITICAL=$(echo "$OVERVIEW"   | jq -r '.[0].scanInformation.vulnerabilityIssues.critical      // 0')
HIGH=$(echo "$OVERVIEW"       | jq -r '.[0].scanInformation.vulnerabilityIssues.high          // 0')
MEDIUM=$(echo "$OVERVIEW"     | jq -r '.[0].scanInformation.vulnerabilityIssues.medium        // 0')
LOW=$(echo "$OVERVIEW"        | jq -r '.[0].scanInformation.vulnerabilityIssues.low           // 0')
BLOCKED_LIC=$(echo "$OVERVIEW"| jq -r '.[0].scanInformation.licenses.blockedLicensesCount     // 0')
TOTAL_PKG=$(echo "$OVERVIEW"  | jq -r '.[0].scanInformation.package.totalPackages             // 0')
VULN_PKG=$(echo "$OVERVIEW"   | jq -r '.[0].scanInformation.package.vulnerablePackages        // 0')

echo ""
echo "══════════════ MDSSC Source Scan Results ══════════════"
printf "  %-25s %s\n" "Malware detected:"    "$MALWARE"
printf "  %-25s %s\n" "Secrets detected:"    "$SECRETS"
printf "  %-25s %s\n" "Critical vulns:"      "$CRITICAL"
printf "  %-25s %s\n" "High vulns:"          "$HIGH"
printf "  %-25s %s\n" "Medium vulns:"        "$MEDIUM"
printf "  %-25s %s\n" "Low vulns:"           "$LOW"
printf "  %-25s %s\n" "Blocked licenses:"    "$BLOCKED_LIC"
printf "  %-25s %s / %s\n" "Vulnerable packages:" "$VULN_PKG" "$TOTAL_PKG"
echo "═══════════════════════════════════════════════════════"

FAILED=false

[[ "$MALWARE"     == "true"  ]]                          && { echo "[MDSSC] FAIL: malware detected";                  FAILED=true; }
[[ "$SECRETS"     == "true"  ]]                          && { echo "[MDSSC] FAIL: secrets/credentials detected";      FAILED=true; }
[[ "$CRITICAL"    -gt 0      ]]                          && { echo "[MDSSC] FAIL: $CRITICAL critical vulnerability/vulnerabilities"; FAILED=true; }
[[ "$FAIL_ON_HIGH" == "true" && "$HIGH" -gt 0 ]]        && { echo "[MDSSC] FAIL: $HIGH high-severity vulnerability/vulnerabilities"; FAILED=true; }
[[ "$BLOCKED_LIC" -gt 0      ]]                          && { echo "[MDSSC] FAIL: $BLOCKED_LIC blocked license(s)";  FAILED=true; }

if [[ "$FAILED" == "true" ]]; then
    exit 1
fi

echo "[MDSSC] Source scan passed."
