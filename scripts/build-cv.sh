#!/bin/sh
# Regenerate public/gene-dai-cv.pdf from the homepage's print stylesheet.
# Rerun after changing About, Journey, Projects, or Connect content.
# Needs the local server: npx wrangler pages dev public --port 8788
set -e
cd "$(dirname "$0")/.."
agent-browser open "http://localhost:8788/?cv=$(date +%s)"
agent-browser pdf "$PWD/public/gene-dai-cv.pdf"
pages=$(pdfinfo public/gene-dai-cv.pdf | awk '/^Pages:/ {print $2}')
[ "$pages" = 1 ] || { echo "CV is $pages pages, expected 1" >&2; exit 1; }
echo "wrote public/gene-dai-cv.pdf (1 page)"
