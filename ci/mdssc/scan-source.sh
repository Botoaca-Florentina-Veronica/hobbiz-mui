#!/usr/bin/env bash
#
# scan-source.sh — scanează codul SURSĂ cu MetaDefender Software Supply Chain.
# Flux: health → (rezolvă workflow) → scan direct → poll overview → rezultate
#       detaliate → (scan indirect repo, opțional) → export SBOM/rapoarte → verdict.
# Logica MDSSC e în lib.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ci/mdssc/lib.sh
source "${SCRIPT_DIR}/lib.sh"

mdssc_require_env

ARCHIVE="mdssc-source-scan.tar.gz"
cleanup() { rm -f "$ARCHIVE"; }
trap cleanup EXIT

# ── Arhivă sursă (împachetare) ───────────────────────────────────────────────────
echo "[MDSSC] Creez arhiva sursă..."
tar czf "$ARCHIVE" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='frontend/dist' \
    --exclude='frontend/.vite' \
    --exclude='device-view_images' \
    --exclude='.vscode' \
    --exclude='docs' \
    --exclude='package-lock.json' \
    --exclude='*.env' \
    --exclude='.env' \
    --exclude='*.log' \
    --exclude='*.png' \
    --exclude='*.jpg' \
    --exclude='*.jpeg' \
    --exclude='*.gif' \
    --exclude='*.ico' \
    --exclude="$ARCHIVE" \
    . || { RC=$?; [ $RC -eq 1 ] || exit $RC; }
echo "[MDSSC] Dimensiune arhivă: $(du -sh "$ARCHIVE" | cut -f1)"

# ── Pipeline MDSSC ─────────────────────────────────────────────────────────────
mdssc_health                                    # 1. GET /version
mdssc_resolve_workflow                          # 2. GET /workflows/{id}
SCAN_ID=$(mdssc_scan_direct "$ARCHIVE")         # 3. POST /scans/direct
mdssc_poll_overview "$SCAN_ID"                  # 4. GET /scans/{id}/overview
MDSSC_DIRECT_OVERVIEW="$MDSSC_OVERVIEW"        # salvează overview-ul direct înainte de indirect
mdssc_scan_details "$SCAN_ID"                   # 5. GET /scans/{id}

# 6. POST /scans — scan indirect al repo-ului conectat (opțional)
if [[ "${MDSSC_INDIRECT_SCAN:-false}" == "true" ]]; then
    INDIRECT_ID=$(mdssc_scan_indirect || true)
    [[ -n "${INDIRECT_ID:-}" ]] && mdssc_poll_overview "$INDIRECT_ID" || true
fi

# Restaurează overview-ul direct pentru verdict — scanul indirect e informativ
MDSSC_OVERVIEW="$MDSSC_DIRECT_OVERVIEW"

mdssc_export_reports "$SCAN_ID"                 # 7. GET /export/{spdx|cyclonedx|pdf|csv}

# ── Verdict ──────────────────────────────────────────────────────────────────────
mdssc_evaluate "Source Scan"
