# shellcheck shell=bash
#
# lib.sh — bibliotecă comună pentru integrarea MetaDefender Software Supply Chain (MDSSC).
# Se sursează (`source ci/mdssc/lib.sh`), nu se execută direct.
#
# Acoperă 7 metode din API-ul MDSSC v3.3.1 
#
#   1. GET  /api/v1/version              — verificare conectivitate + versiune server
#   2. GET  /api/v1/workflows/{id}       — rezolvă StorageId (serviceId) + RepositoryId din workflow
#   3. POST /api/v1/scans/direct         — încarcă arhiva sursă/artefact + pornește scanarea
#   4. GET  /api/v1/scans/{id}/overview  — polling bogat (progres %, malware, secrete, licențe blocate)
#   5. GET  /api/v1/scans/{id}           — rezultate detaliate complete (vulnerabilityIssues, fișiere infectate…)
#   6. POST /api/v1/scans                — scan indirect al unui repo conectat, după referință git (opțional)
#   7. GET  /api/v1/export/{spdx|cyclonedx|pdf|csv} — export SBOM / rapoarte ca artefacte CI
#
# Variabile de mediu așteptate:
#   MDSSC_API_URL, MDSSC_API_KEY                     — obligatorii (credențiale Jenkins)
#   MDSSC_WORKFLOW_ID                                — opțional: fixează workflow-ul folosit
#   MDSSC_POLL_INTERVAL (10), MDSSC_POLL_TIMEOUT (300)
#   MDSSC_FAIL_ON_HIGH (false)                       — pică build-ul și pe vulnerabilități high
#   MDSSC_REPORTS_DIR (mdssc-reports)                — unde se salvează SBOM/rapoartele
#   MDSSC_EXPORT_REPORTS (true)                      — dezactivează exportul cu 'false'
#   MDSSC_INDIRECT_SCAN (false)                      — activează metoda #6 (scan repo conectat)
#   MDSSC_SCAN_TYPE (0), MDSSC_REPO_REFERENCE        — parametri pentru scanul indirect

set -euo pipefail

MDSSC_PY="${MDSSC_PY:-python3}"

# ── Validare mediu ─────────────────────────────────────────────────────────────
mdssc_require_env() {
    : "${MDSSC_API_URL:?MDSSC_API_URL is not set — add it as a Jenkins credential}"
    : "${MDSSC_API_KEY:?MDSSC_API_KEY is not set — add it as a Jenkins credential}"
    MDSSC_API_URL="${MDSSC_API_URL%/}"   # elimină slash-ul final dacă există
}

# ── Parsare JSON ───────────────────────────────────────────────────────────────
# mdssc_json <dotted.path>   (citește JSON din stdin)
#   - acceptă indici numerici (ex: "scanIds.0")
#   - dacă valoarea curentă e un array iar cheia NU e numerică, coboară automat în [0]
#     (răspunsul /overview e un array[object], nu un obiect — astfel îl tratăm corect)
#   - fallback case-insensitive pe prima literă (API-ul amestecă scanIds / ScanIds)
mdssc_json() {
    "$MDSSC_PY" -c '
import sys, json
try:
    data = json.load(sys.stdin)
except Exception:
    print(""); sys.exit(0)
val = data
try:
    for k in sys.argv[1].split("."):
        if isinstance(val, list) and not k.isdigit():
            val = val[0]
        if isinstance(val, list):
            val = val[int(k)]
        elif isinstance(val, dict):
            for cand in (k, k[0].upper()+k[1:], k[0].lower()+k[1:], k.lower(), k.upper()):
                if cand in val:
                    val = val[cand]; break
            else:
                val = None
        else:
            val = None
        if val is None:
            break
    if val is None:           print("")
    elif isinstance(val, bool): print(str(val).lower())
    elif isinstance(val, (dict, list)): print(json.dumps(val))
    else:                     print(val)
except Exception:
    print("")
' "$1"
}

# mdssc_json_len <dotted.path>   — lungimea array-ului de la path (0 dacă lipsește)
mdssc_json_len() {
    "$MDSSC_PY" -c '
import sys, json
try:
    data = json.load(sys.stdin)
    val = data
    for k in sys.argv[1].split("."):
        if isinstance(val, list) and not k.isdigit(): val = val[0]
        val = val[int(k)] if isinstance(val, list) else val.get(k)
    print(len(val) if isinstance(val, list) else 0)
except Exception:
    print(0)
' "$1"
}

# ── 1. Health / versiune ───────────────────────────────────────────────────────
# GET /api/v1/version
mdssc_health() {
    echo "[MDSSC] Verificare conectivitate server (GET /api/v1/version)..."
    local resp
    if ! resp=$(curl -sf -H "apikey: ${MDSSC_API_KEY}" "${MDSSC_API_URL}/api/v1/version"); then
        echo "[MDSSC] ERROR: serverul MDSSC nu răspunde la ${MDSSC_API_URL}/api/v1/version"
        return 1
    fi
    local ver; ver=$(echo "$resp" | mdssc_json "version")
    echo "[MDSSC] Server MDSSC disponibil — versiune: ${ver:-necunoscută}"
}

# ── 2. Rezolvare workflow → StorageId + RepositoryId ─────────────────────────────
# GET /api/v1/workflows/{id}
# Setează variabilele globale MDSSC_RESOLVED_SERVICE_ID și MDSSC_RESOLVED_REPO_ID.
mdssc_resolve_workflow() {
    MDSSC_RESOLVED_SERVICE_ID=""
    MDSSC_RESOLVED_REPO_ID=""
    [[ -z "${MDSSC_WORKFLOW_ID:-}" ]] && { echo "[MDSSC] (workflow neconfigurat — sar peste rezolvarea storage/repo)"; return 0; }

    echo "[MDSSC] Rezolv workflow-ul ${MDSSC_WORKFLOW_ID} (GET /api/v1/workflows/{id})..."
    local resp
    if ! resp=$(curl -sf -H "apikey: ${MDSSC_API_KEY}" "${MDSSC_API_URL}/api/v1/workflows/${MDSSC_WORKFLOW_ID}"); then
        echo "[MDSSC] WARNING: nu am putut citi workflow-ul ${MDSSC_WORKFLOW_ID}"
        return 0
    fi
    MDSSC_RESOLVED_SERVICE_ID=$(echo "$resp" | mdssc_json "scanSources.0.serviceId")
    MDSSC_RESOLVED_REPO_ID=$(   echo "$resp" | mdssc_json "scanSources.0.repositories.0.repositoryId")
    local wf_name; wf_name=$(echo "$resp" | mdssc_json "name")
    echo "[MDSSC] Workflow: ${wf_name:-?} | StorageId: ${MDSSC_RESOLVED_SERVICE_ID:-?} | RepositoryId: ${MDSSC_RESOLVED_REPO_ID:-?}"
}

# ── 3. Scan direct (upload arhivă) ───────────────────────────────────────────────
# POST /api/v1/scans/direct  → echo scanId la stdout
mdssc_scan_direct() {
    local archive="$1"
    echo "[MDSSC] Încarc '${archive}' (POST /api/v1/scans/direct)..." >&2

    local args=(-s -X POST -H "apikey: ${MDSSC_API_KEY}" -F "files=@${archive}" -w "\nHTTP_STATUS:%{http_code}")
    [[ -n "${MDSSC_WORKFLOW_ID:-}" ]] && args+=(-F "workflowId=${MDSSC_WORKFLOW_ID}")

    local raw status body
    raw=$(curl "${args[@]}" "${MDSSC_API_URL}/api/v1/scans/direct")
    status=$(echo "$raw" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    body=$(echo "$raw" | sed '/HTTP_STATUS:/d')
    echo "[MDSSC] HTTP status: ${status}" >&2

    if [[ "$status" != "200" ]]; then
        echo "[MDSSC] ERROR: upload eșuat (HTTP ${status}): ${body}" >&2
        return 1
    fi
    local scan_id; scan_id=$(echo "$body" | mdssc_json "scanIds.0")
    [[ -z "$scan_id" ]] && { echo "[MDSSC] ERROR: niciun scanId returnat: ${body}" >&2; return 1; }
    echo "[MDSSC] Scan ID: ${scan_id}" >&2
    echo "$scan_id"
}

# ── 6. Scan indirect (repo conectat, după referință git) ─────────────────────────
# POST /api/v1/scans  → echo scanId la stdout
# Necesită storageId + repositoryId (din workflow) și o referință (branch/commit).
mdssc_scan_indirect() {
    local storage_id="${MDSSC_RESOLVED_SERVICE_ID:-}"
    local repo_id="${MDSSC_RESOLVED_REPO_ID:-}"
    local reference="${MDSSC_REPO_REFERENCE:-}"

    if [[ -z "$storage_id" || -z "$repo_id" ]]; then
        echo "[MDSSC] Scan indirect omis — StorageId/RepositoryId indisponibile (configurează MDSSC_WORKFLOW_ID)." >&2
        return 0
    fi

    local payload
    payload=$(STORAGE_ID="$storage_id" SCAN_TYPE="${MDSSC_SCAN_TYPE:-0}" WORKFLOW_ID="${MDSSC_WORKFLOW_ID:-}" \
              REPO_ID="$repo_id" REPO_REFERENCE="$reference" \
              "$MDSSC_PY" -c '
import json, os
ref = os.environ.get("REPO_REFERENCE", "")
body = {
    "storageId":    os.environ.get("STORAGE_ID", ""),
    "scanType":     int(os.environ.get("SCAN_TYPE", "0") or 0),
    "workflowId":   os.environ.get("WORKFLOW_ID", ""),
    "repositoryId": os.environ.get("REPO_ID", ""),
    "repositoryReferences": [ref] if ref else [],
}
print(json.dumps(body))
')

    echo "[MDSSC] Scan indirect repo (POST /api/v1/scans) — ref: ${reference:-default}..." >&2
    local raw status body
    raw=$(curl -s -X POST -H "apikey: ${MDSSC_API_KEY}" -H "Content-Type: application/json" \
               -d "$payload" -w "\nHTTP_STATUS:%{http_code}" "${MDSSC_API_URL}/api/v1/scans")
    status=$(echo "$raw" | grep -o 'HTTP_STATUS:[0-9]*' | cut -d: -f2)
    body=$(echo "$raw" | sed '/HTTP_STATUS:/d')
    if [[ "$status" != "200" ]]; then
        echo "[MDSSC] WARNING: scan indirect eșuat (HTTP ${status}): ${body}" >&2
        return 0
    fi
    local scan_id; scan_id=$(echo "$body" | mdssc_json "scanIds.0")
    echo "[MDSSC] Scan indirect pornit — Scan ID: ${scan_id:-?}" >&2
    echo "$scan_id"
}

# ── 4. Polling overview ──────────────────────────────────────────────────────────
# GET /api/v1/scans/{id}/overview  → salvează ultimul răspuns în MDSSC_OVERVIEW
mdssc_poll_overview() {
    local scan_id="$1"
    local interval="${MDSSC_POLL_INTERVAL:-10}"
    local timeout="${MDSSC_POLL_TIMEOUT:-300}"
    local elapsed=0 state="" progress=""

    echo "[MDSSC] Polling overview (timeout ${timeout}s, interval ${interval}s)..."
    while true; do
        MDSSC_OVERVIEW=$(curl -sf -H "apikey: ${MDSSC_API_KEY}" \
            "${MDSSC_API_URL}/api/v1/scans/${scan_id}/overview")
        state=$(   echo "$MDSSC_OVERVIEW" | mdssc_json "scanStatus.scanningState")
        progress=$(echo "$MDSSC_OVERVIEW" | mdssc_json "scanStatus.scanProgress")
        echo "[MDSSC] Stare: ${state:-unknown} | Progres: ${progress:-0}%"

        case "${state:-}" in
            Completed|completed|Done|done|Finished|finished|Failed|failed|Error|error) break ;;
        esac
        if [[ $elapsed -ge $timeout ]]; then
            echo "[MDSSC] ERROR: timeout după ${timeout}s (ultima stare: ${state:-unknown})"
            return 1
        fi
        sleep "$interval"
        elapsed=$((elapsed + interval))
    done

    case "${state:-}" in
        Failed|failed|Error|error)
            echo "[MDSSC] ERROR: scanarea s-a terminat cu eroare"; return 1 ;;
    esac
}

# ── 5. Rezultate detaliate complete ──────────────────────────────────────────────
# GET /api/v1/scans/{id}
mdssc_scan_details() {
    local scan_id="$1"
    echo "[MDSSC] Rezultate detaliate (GET /api/v1/scans/{id})..."
    local resp
    if ! resp=$(curl -sf -H "apikey: ${MDSSC_API_KEY}" "${MDSSC_API_URL}/api/v1/scans/${scan_id}"); then
        echo "[MDSSC] WARNING: nu am putut citi rezultatele detaliate"
        return 0
    fi
    local crit high med low unk infected secrets blocked start stop dur
    crit=$(    echo "$resp" | mdssc_json "vulnerabilityIssues.critical")
    high=$(    echo "$resp" | mdssc_json "vulnerabilityIssues.high")
    med=$(     echo "$resp" | mdssc_json "vulnerabilityIssues.medium")
    low=$(     echo "$resp" | mdssc_json "vulnerabilityIssues.low")
    unk=$(     echo "$resp" | mdssc_json "vulnerabilityIssues.unknown")
    infected=$(echo "$resp" | mdssc_json "infectedFiles")
    secrets=$( echo "$resp" | mdssc_json "filesWithSecrets")
    blocked=$( echo "$resp" | mdssc_json "blockedLicensesCount")
    start=$(   echo "$resp" | mdssc_json "startTime")
    stop=$(    echo "$resp" | mdssc_json "stopTime")
    dur=$(     echo "$resp" | mdssc_json "duration")

    echo "  ── Detaliat ───────────────────────────────"
    printf "  %-22s %s\n" "Fișiere infectate:"   "${infected:-0}"
    printf "  %-22s %s\n" "Fișiere cu secrete:"  "${secrets:-0}"
    printf "  %-22s C:%s H:%s M:%s L:%s U:%s\n" "Vulnerabilități:" "${crit:-0}" "${high:-0}" "${med:-0}" "${low:-0}" "${unk:-0}"
    printf "  %-22s %s\n" "Licențe blocate:"     "${blocked:-0}"
    printf "  %-22s %s → %s (%s)\n" "Interval:"   "${start:-?}" "${stop:-?}" "${dur:-?}"
}

# ── 7. Export SBOM / rapoarte ─────────────────────────────────────────────────────
# GET /api/v1/export/spdx/{scanId}, /cyclonedx/{repoId}, /pdf/overview/{scanId}, /csv/cves
mdssc_export_reports() {
    local scan_id="$1"
    [[ "${MDSSC_EXPORT_REPORTS:-true}" == "true" ]] || { echo "[MDSSC] Export rapoarte dezactivat (MDSSC_EXPORT_REPORTS=false)."; return 0; }

    local outdir="${MDSSC_REPORTS_DIR:-mdssc-reports}"
    mkdir -p "$outdir"
    echo "[MDSSC] Export rapoarte în '${outdir}/'..."

    # helper: descarcă un export, raportează dar nu pică build-ul dacă lipsește
    _mdssc_fetch() {
        local url="$1" out="$2" label="$3" code
        code=$(curl -s -H "apikey: ${MDSSC_API_KEY}" -o "$out" -w "%{http_code}" "$url" || echo 000)
        if [[ "$code" == "200" && -s "$out" ]]; then
            echo "[MDSSC]   ✓ ${label} → ${out} ($(du -h "$out" | cut -f1))"
        else
            echo "[MDSSC]   - ${label} indisponibil (HTTP ${code})"
            rm -f "$out"
        fi
    }

    _mdssc_fetch "${MDSSC_API_URL}/api/v1/export/spdx/${scan_id}"          "${outdir}/sbom-spdx.json"     "SBOM SPDX"
    _mdssc_fetch "${MDSSC_API_URL}/api/v1/export/pdf/overview/${scan_id}"  "${outdir}/overview.pdf"       "Raport PDF overview"
    _mdssc_fetch "${MDSSC_API_URL}/api/v1/export/csv/cves"                 "${outdir}/cves.csv"           "CSV CVE-uri"

    # CycloneDX se exportă pe repository — doar dacă avem RepositoryId din workflow
    if [[ -n "${MDSSC_RESOLVED_REPO_ID:-}" ]]; then
        _mdssc_fetch "${MDSSC_API_URL}/api/v1/export/cyclonedx/${MDSSC_RESOLVED_REPO_ID}" "${outdir}/sbom-cyclonedx.json" "SBOM CycloneDX"
    fi
}

# ── Evaluare verdict + gating ─────────────────────────────────────────────────────
# Citește MDSSC_OVERVIEW (setat de mdssc_poll_overview). Întoarce 1 dacă build-ul trebuie să pice.
mdssc_evaluate() {
    local label="${1:-Scan}"
    local malware secrets crit high med low blocked total_pkg vuln_pkg
    malware=$(  echo "$MDSSC_OVERVIEW" | mdssc_json "scanInformation.malware")
    secrets=$(  echo "$MDSSC_OVERVIEW" | mdssc_json "scanInformation.secret")
    crit=$(     echo "$MDSSC_OVERVIEW" | mdssc_json "scanInformation.vulnerabilityIssues.critical")
    high=$(     echo "$MDSSC_OVERVIEW" | mdssc_json "scanInformation.vulnerabilityIssues.high")
    med=$(      echo "$MDSSC_OVERVIEW" | mdssc_json "scanInformation.vulnerabilityIssues.medium")
    low=$(      echo "$MDSSC_OVERVIEW" | mdssc_json "scanInformation.vulnerabilityIssues.low")
    blocked=$(  echo "$MDSSC_OVERVIEW" | mdssc_json "scanInformation.licenses.blockedLicensesCount")
    total_pkg=$(echo "$MDSSC_OVERVIEW" | mdssc_json "scanInformation.package.totalPackages")
    vuln_pkg=$( echo "$MDSSC_OVERVIEW" | mdssc_json "scanInformation.package.vulnerablePackages")

    echo ""
    echo "═════════════ MDSSC ${label} Results ═════════════"
    printf "  %-25s %s\n"      "Malware detectat:"     "${malware:-false}"
    printf "  %-25s %s\n"      "Secrete detectate:"    "${secrets:-false}"
    printf "  %-25s %s\n"      "Critical vulns:"       "${crit:-0}"
    printf "  %-25s %s\n"      "High vulns:"           "${high:-0}"
    printf "  %-25s %s\n"      "Medium vulns:"         "${med:-0}"
    printf "  %-25s %s\n"      "Low vulns:"            "${low:-0}"
    printf "  %-25s %s\n"      "Licențe blocate:"      "${blocked:-0}"
    printf "  %-25s %s / %s\n" "Pachete vulnerabile:"  "${vuln_pkg:-0}" "${total_pkg:-0}"
    echo "═══════════════════════════════════════════════════════"

    local failed=false
    [[ "${malware:-false}" == "true" ]] && { echo "[MDSSC] FAIL: malware detectat"; failed=true; }
    [[ "${secrets:-false}" == "true" ]] && { echo "[MDSSC] FAIL: secrete/credențiale detectate"; failed=true; }
    [[ "${crit:-0}" -gt 0 ]]            && { echo "[MDSSC] WARNING: ${crit} vulnerabilitate(ăți) critică(e) — revizuire necesară"; }
    [[ "${MDSSC_FAIL_ON_HIGH:-false}" == "true" && "${high:-0}" -gt 0 ]] && { echo "[MDSSC] FAIL: ${high} vulnerabilitate(ăți) high"; failed=true; }
    [[ "${blocked:-0}" -gt 0 ]]         && { echo "[MDSSC] FAIL: ${blocked} licență(e) blocată(e)"; failed=true; }

    [[ "$failed" == "true" ]] && return 1
    echo "[MDSSC] ${label}: trecut."
    return 0
}
