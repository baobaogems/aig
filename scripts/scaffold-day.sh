#!/bin/bash
# Scaffold a per-day published folder from template.
# Usage:
#   ./scripts/scaffold-day.sh 7
#   ./scripts/scaffold-day.sh 7 --source content/day9-draft.md
#
# Creates: content/day-07-published/{metrics.md,comments.md}
# Filled placeholders: {{DAY_NUM}}, {{SOURCE_FILE}}, {{PUBLISH_DATETIME}}

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <day-number> [--source <path>]"
  echo "  e.g. $0 7"
  echo "  e.g. $0 7 --source content/day9-draft.md"
  exit 1
fi

DAY_RAW="$1"
DAY_NUM=$(printf "%02d" "$1")
SOURCE_FILE=""

# Parse --source flag
shift
while [ $# -gt 0 ]; do
  case "$1" in
    --source) SOURCE_FILE="$2"; shift 2;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

# Resolve repo root (script lives in scripts/, so parent = root)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TEMPLATE_DIR="$ROOT/content/_template-per-day"
TARGET_DIR="$ROOT/content/day-${DAY_NUM}-published"

if [ -d "$TARGET_DIR" ]; then
  echo "❌ $TARGET_DIR already exists. Aborting (won't overwrite)."
  exit 1
fi

if [ ! -d "$TEMPLATE_DIR" ]; then
  echo "❌ Template dir missing: $TEMPLATE_DIR"
  exit 1
fi

mkdir -p "$TARGET_DIR"

PUBLISH_DT="$(date '+%Y-%m-%d %H:%M')"
[ -z "$SOURCE_FILE" ] && SOURCE_FILE="<fill: e.g. content/dayXX-final.md>"

for f in metrics.md comments.md; do
  sed -e "s|{{DAY_NUM}}|${DAY_NUM}|g" \
      -e "s|{{SOURCE_FILE}}|${SOURCE_FILE}|g" \
      -e "s|{{PUBLISH_DATETIME}}|${PUBLISH_DT}|g" \
      "$TEMPLATE_DIR/$f" > "$TARGET_DIR/$f"
done

echo "✅ Scaffolded: $TARGET_DIR"
echo "   - metrics.md"
echo "   - comments.md"
echo ""
echo "Next:"
echo "  1. Drop X analytics screenshot into $TARGET_DIR/analytics-24h.png"
echo "  2. Open chat: 'Đây là Day $DAY_RAW analytics 24h, fill giúp em' + attach screenshot"
echo "  3. Append 3-line entry to content/_learnings-log.md"
