#!/usr/bin/env bash
set -euo pipefail

# Deletes failing GitHub Actions workflow runs for a repository.
#
# Usage:
#   ./delete-failing-runs.sh [OPTIONS]
#
# Options:
#   -o, --owner OWNER       GitHub repository owner (default: inferred from git remote)
#   -r, --repo  REPO        GitHub repository name  (default: inferred from git remote)
#   -w, --workflow WORKFLOW Filter by workflow name or filename (optional)
#   -s, --status STATUS     Comma-separated conclusions to delete
#                           (default: failure,cancelled,timed_out,action_required,startup_failure)
#   -l, --limit  N          Maximum runs to fetch per conclusion (default: 100)
#   -n, --dry-run           Print what would be deleted without actually deleting
#   -h, --help              Show this help message
#
# Prerequisites:
#   - GitHub CLI (gh) must be installed and authenticated: https://cli.github.com
#   - jq must be installed: https://jqlang.github.io/jq/
#
# Examples:
#   # Delete all failing runs in the current repo
#   ./delete-failing-runs.sh
#
#   # Dry run – see what would be deleted without deleting anything
#   ./delete-failing-runs.sh --dry-run
#
#   # Delete only failed and cancelled runs for a specific workflow
#   ./delete-failing-runs.sh --workflow ci-cd.yml --status failure,cancelled
#
#   # Target a different repository
#   ./delete-failing-runs.sh --owner myorg --repo myrepo

# ---------------------------------------------------------------------------
# Colour helpers
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
log_success() { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
OWNER=""
REPO=""
WORKFLOW=""
STATUSES="failure,cancelled,timed_out,action_required,startup_failure"
DRY_RUN=false
LIMIT=100

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
usage() {
    grep '^#' "$0" | grep -v '^#!/' | sed 's/^# \?//'
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--owner)    OWNER="$2";    shift 2 ;;
        -r|--repo)     REPO="$2";     shift 2 ;;
        -w|--workflow) WORKFLOW="$2"; shift 2 ;;
        -s|--status)   STATUSES="$2"; shift 2 ;;
        -l|--limit)    LIMIT="$2";    shift 2 ;;
        -n|--dry-run)  DRY_RUN=true;  shift   ;;
        -h|--help)     usage ;;
        *) log_error "Unknown option: $1"; usage ;;
    esac
done

# ---------------------------------------------------------------------------
# Prerequisite checks
# ---------------------------------------------------------------------------
for cmd in gh jq; do
    if ! command -v "$cmd" &>/dev/null; then
        log_error "'$cmd' is not installed."
        [[ "$cmd" == "gh" ]] && log_error "Install from https://cli.github.com and run 'gh auth login'."
        [[ "$cmd" == "jq" ]] && log_error "Install from https://jqlang.github.io/jq/"
        exit 1
    fi
done

if ! gh auth status &>/dev/null; then
    log_error "GitHub CLI is not authenticated. Run 'gh auth login' first."
    exit 1
fi

# ---------------------------------------------------------------------------
# Resolve owner/repo from the current git remote when not provided
# ---------------------------------------------------------------------------
if [[ -z "$OWNER" || -z "$REPO" ]]; then
    REMOTE_URL=$(git remote get-url origin 2>/dev/null || true)
    if [[ -z "$REMOTE_URL" ]]; then
        log_error "Cannot determine repository: no git remote 'origin' found."
        log_error "Provide --owner and --repo explicitly."
        exit 1
    fi
    # Support HTTPS (https://github.com/owner/repo.git) and SSH (git@github.com:owner/repo.git)
    if [[ "$REMOTE_URL" =~ github\.com[/:]([^/]+)/([^/.]+)(\.git)?$ ]]; then
        OWNER="${OWNER:-${BASH_REMATCH[1]}}"
        REPO="${REPO:-${BASH_REMATCH[2]}}"
    else
        log_error "Cannot parse owner/repo from remote URL: $REMOTE_URL"
        log_error "Provide --owner and --repo explicitly."
        exit 1
    fi
fi

REPO_SLUG="$OWNER/$REPO"
log_info "Repository : $REPO_SLUG"
[[ -n "$WORKFLOW" ]] && log_info "Workflow   : $WORKFLOW"
log_info "Conclusions: $STATUSES"
[[ "$DRY_RUN" == true ]] && log_warn "DRY RUN – no runs will be deleted."

# ---------------------------------------------------------------------------
# Build the list of conclusions to delete
# ---------------------------------------------------------------------------
IFS=',' read -ra CONCLUSION_LIST <<< "$STATUSES"

# ---------------------------------------------------------------------------
# Fetch and delete runs for each conclusion
# ---------------------------------------------------------------------------
TOTAL_DELETED=0
TOTAL_FOUND=0

for CONCLUSION in "${CONCLUSION_LIST[@]}"; do
    # Trim surrounding whitespace
    CONCLUSION=$(echo "$CONCLUSION" | xargs)

    log_info "Fetching runs with conclusion='$CONCLUSION'..."

    # gh run list does not support --conclusion; pipe JSON output through jq.
    # Use --arg to safely pass the conclusion value (avoids jq injection).
    # Outputs tab-separated: id \t workflowName \t title \t createdAt
    JQ_FILTER='[.[] | select(.conclusion == $c) | [.databaseId|tostring, .workflowName, .displayTitle, .createdAt]] | .[] | @tsv'

    if [[ -n "$WORKFLOW" ]]; then
        RUN_LINES=$(gh run list \
            --repo "$REPO_SLUG" \
            --workflow "$WORKFLOW" \
            --json "databaseId,displayTitle,workflowName,createdAt,conclusion" \
            --limit "$LIMIT" \
            2>/dev/null | jq -r --arg c "$CONCLUSION" "$JQ_FILTER" || true)
    else
        RUN_LINES=$(gh run list \
            --repo "$REPO_SLUG" \
            --json "databaseId,displayTitle,workflowName,createdAt,conclusion" \
            --limit "$LIMIT" \
            2>/dev/null | jq -r --arg c "$CONCLUSION" "$JQ_FILTER" || true)
    fi

    if [[ -z "$RUN_LINES" ]]; then
        log_info "  No runs found with conclusion='$CONCLUSION'."
        continue
    fi

    while IFS=$'\t' read -r RUN_ID WORKFLOW_NAME TITLE CREATED; do
        [[ -z "$RUN_ID" ]] && continue

        TOTAL_FOUND=$((TOTAL_FOUND + 1))

        if [[ "$DRY_RUN" == true ]]; then
            log_warn "  [DRY RUN] Run #$RUN_ID | $WORKFLOW_NAME | $TITLE | $CREATED"
        else
            log_info "  Deleting run #$RUN_ID | $WORKFLOW_NAME | $TITLE | $CREATED ..."
            if gh run delete "$RUN_ID" --repo "$REPO_SLUG" 2>/dev/null; then
                log_success "  Deleted run #$RUN_ID"
                TOTAL_DELETED=$((TOTAL_DELETED + 1))
            else
                log_warn "  Failed to delete run #$RUN_ID (may already be deleted or insufficient permissions)"
            fi
        fi
    done <<< "$RUN_LINES"

done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
if [[ "$DRY_RUN" == true ]]; then
    log_warn "Dry run complete. $TOTAL_FOUND run(s) would be deleted."
else
    log_success "Done. Deleted $TOTAL_DELETED of $TOTAL_FOUND matching run(s) in $REPO_SLUG."
fi
