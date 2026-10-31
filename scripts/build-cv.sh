#!/bin/sh
# Regenerate the one-page CV PDFs from the print stylesheet:
#   public/gene-dai-cv.pdf     from /      (English)
#   public/gene-dai-cv-zh.pdf  from /zh/   (Chinese)
# Rerun after changing About, Journey, Projects, or Connect content.
# Needs the local server: npx wrangler pages dev public --port 8788
set -e
cd "$(dirname "$0")/.."
for pair in "/ gene-dai-cv.pdf" "/zh/ gene-dai-cv-zh.pdf"; do
  set -- $pair
  agent-browser open "http://localhost:8788$1?cv=$(date +%s)"
  agent-browser pdf "$PWD/public/$2"
  pages=$(pdfinfo "public/$2" | awk '/^Pages:/ {print $2}')
  [ "$pages" = 1 ] || { echo "$2 is $pages pages, expected 1" >&2; exit 1; }
  echo "wrote public/$2 (1 page)"
done
