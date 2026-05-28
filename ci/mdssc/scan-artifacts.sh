#!/usr/bin/env bash
#
# scan-artifacts.sh — scanează ARTEFACTUL construit (frontend/dist) cu MDSSC.
# Flux: health → scan direct → poll overview → rezultate detaliate →
#       export SBOM/rapoarte → verdict. Logica MDSSC e în lib.sh.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ci/mdssc/lib.sh
source "${SCRIPT_DIR}/lib.sh"

mdssc_require_env
: "${BUILD_NUMBER:?BUILD_NUMBER is not set}"

ARTIFACT_DIR="${MDSSC_ARTIFACT_DIR:-frontend/dist}"
ARCHIVE="mdssc-artifact-scan-${BUILD_NUMBER}.tar.gz"
cleanup() { rm -f "$ARCHIVE"; }
trap cleanup EXIT

if [[ ! -d "$ARTIFACT_DIR" ]]; then
    echo "[MDSSC] ERROR: directorul de artefact '$ARTIFACT_DIR' nu există — a rulat stage-ul de build?"
    exit 1
fi

# ── Arhivă artefact (împachetare) ────────────────────────────────────────────────
echo "[MDSSC] Creez arhiva artefactului din '$ARTIFACT_DIR'..."
tar czf "$ARCHIVE" "$ARTIFACT_DIR"
echo "[MDSSC] Dimensiune arhivă: $(du -sh "$ARCHIVE" | cut -f1)"

# ── Pipeline MDSSC ─────────────────────────────────────────────────────────────
mdssc_health                                    # 1. GET /version
SCAN_ID=$(mdssc_scan_direct "$ARCHIVE")         # 3. POST /scans/direct
mdssc_poll_overview "$SCAN_ID"                  # 4. GET /scans/{id}/overview
mdssc_scan_details "$SCAN_ID"                   # 5. GET /scans/{id}
mdssc_export_reports "$SCAN_ID"                 # 7. GET /export/{spdx|pdf|csv}

# ── Verdict ──────────────────────────────────────────────────────────────────────
echo "[MDSSC] Artefact scanat: ${ARTIFACT_DIR}"
mdssc_evaluate "Artifact Scan"
