#!/bin/bash
# Generates the next 7 days of crosswords + spelling bees, then pushes to GitHub.
# Run from the project root: ./scripts/generate-week.sh

set -e
cd "$(dirname "$0")/.."

echo "🗺  Generating next 7 days of NW5 puzzles…"
echo ""

for i in 1 2 3 4 5 6 7; do
  DATE=$(date -v+${i}d +%Y-%m-%d 2>/dev/null || date -d "+${i} days" +%Y-%m-%d)
  echo "── $DATE ──────────────────────────────"
  ./node_modules/.bin/tsx scripts/generate-puzzle.ts "$DATE"
  ./node_modules/.bin/tsx scripts/generate-bee.ts "$DATE"
  echo ""
done

echo "✅ All done. Pushing to GitHub…"
git add puzzles/ bees/
git diff --staged --quiet && echo "Nothing new to commit." && exit 0
git commit -m "Add puzzles for next 7 days ($(date +%Y-%m-%d))"
git push
echo ""
echo "🚀 Pushed! Vercel will deploy automatically."
