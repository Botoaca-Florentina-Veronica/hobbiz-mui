#!/usr/bin/env bash
#
# discover.sh — listează ce e configurat în MDSSC (workflow-uri, conexiuni/services,
# repo-uri, branch-uri), ca să afli valorile pentru scanul indirect:
#   MDSSC_WORKFLOW_ID, MDSSC_REPO_REFERENCE (și, implicit, StorageId + RepositoryId).
#
# Rulare locală (nu în pipeline — e doar un tool de inspecție):
#   MDSSC_API_URL=https://host MDSSC_API_KEY=cheia ci/mdssc/discover.sh
#
# Folosește:
#   GET /api/v1/workflows                         — workflow-uri + scanSources
#   GET /api/v1/services                          — conexiuni (services)
#   GET /api/v1/services/{serviceId}/references    — branch-uri scanabile per repo
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ci/mdssc/lib.sh
source "${SCRIPT_DIR}/lib.sh"

mdssc_require_env
mdssc_health

echo ""
echo "════════════ Workflows (GET /api/v1/workflows) ════════════"
WF=$(curl -sf -H "apikey: ${MDSSC_API_KEY}" "${MDSSC_API_URL}/api/v1/workflows" || echo '[]')
echo "$WF" | "$MDSSC_PY" -c '
import sys, json
try:
    data = json.load(sys.stdin)
except Exception:
    data = []
if not data:
    print("  (niciun workflow configurat)")
for wf in data:
    print("  workflowId : " + str(wf.get("id")))
    print("  name       : " + str(wf.get("name")))
    for s in wf.get("scanSources") or []:
        print("    StorageId (serviceId): " + str(s.get("serviceId")) + "  (" + str(s.get("serviceName")) + ")")
        for r in s.get("repositories") or []:
            refs = ", ".join(r.get("referencesToScan") or []) or "-"
            print("      repositoryId: " + str(r.get("repositoryId")) + "  (" + str(r.get("repositoryName")) + ")")
            print("        branches scanate: " + refs)
    print("")
'

echo "════════════ Conexiuni (GET /api/v1/services) ════════════"
SVC=$(curl -sf -H "apikey: ${MDSSC_API_KEY}" "${MDSSC_API_URL}/api/v1/services" || echo '{}')
SERVICE_IDS=$(echo "$SVC" | "$MDSSC_PY" -c '
import sys, json
try:
    data = json.load(sys.stdin)
except Exception:
    data = {}
svcs = data.get("serviceDtos") or data.get("ServiceDtos") or []
if not svcs:
    print("  (nicio conexiune)", file=sys.stderr)
for s in svcs:
    print("  serviceId: " + str(s.get("id")) + "  name: " + str(s.get("name")) +
          "  scanWorkflowId: " + str(s.get("scanWorkflowId")), file=sys.stderr)
    print(s.get("id"))   # stdout: doar id-urile, pentru pasul cu references
'
)

echo "════════════ Branch-uri per repo (GET /api/v1/services/{id}/references) ════════════"
if [[ -z "$SERVICE_IDS" ]]; then
    echo "  (nimic de interogat)"
fi
for sid in $SERVICE_IDS; do
    echo "  service ${sid}:"
    curl -sf -H "apikey: ${MDSSC_API_KEY}" "${MDSSC_API_URL}/api/v1/services/${sid}/references" 2>/dev/null \
      | "$MDSSC_PY" -c '
import sys, json
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for r in data.get("repositoryReferenceInfoArray") or []:
    refs = ", ".join(r.get("references") or []) or "-"
    print("    repositoryId " + str(r.get("repositoryId")) +
          " | default: " + str(r.get("defaultReference")) + " | toate: " + refs)
' || echo "    (nu am putut citi references)"
done

echo ""
echo "──────────────────────────────────────────────────────────"
echo "Pune valorile de mai sus în Jenkins (stage 'Scan Source Code'):"
echo "  MDSSC_INDIRECT_SCAN  = 'true'"
echo "  MDSSC_WORKFLOW_ID    = '<workflowId>'"
echo "  MDSSC_REPO_REFERENCE = '<branch, ex: main>'"
echo "  MDSSC_SCAN_TYPE      = '0'   # confirmă valoarea declanșând un scan din UI o dată"
