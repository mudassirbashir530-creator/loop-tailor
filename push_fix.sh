#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Loop Tailor – Invoice fix push script
# Run this from the ROOT of your local project folder
# Usage: bash push_fix.sh
# ─────────────────────────────────────────────────────────────────

set -e   # exit on any error

REPO="https://github.com/mudassirbashir530-creator/loop-tailor.git"
FILE="src/pages/Invoice.tsx"

echo ""
echo "════════════════════════════════════════"
echo "  Loop Tailor – Invoice Fix Deployment"
echo "════════════════════════════════════════"
echo ""

# ── 1. Make sure we are inside a git repo ─────────────────────────
if [ ! -d ".git" ]; then
  echo "❌  Not inside a git repository."
  echo "    Run this script from the root of your loop-tailor project."
  exit 1
fi

# ── 2. Check Invoice.tsx was placed in the right location ─────────
if [ ! -f "$FILE" ]; then
  echo "❌  $FILE not found."
  echo "    Please copy the downloaded Invoice.tsx to src/pages/Invoice.tsx first."
  exit 1
fi

echo "✅  Found $FILE"

# ── 3. Stage the changed file ─────────────────────────────────────
git add "$FILE"

# ── 4. Commit ─────────────────────────────────────────────────────
git commit -m "fix: invoice PDF download, WhatsApp share, and sharing

- Fix html2canvas rendering by using onclone callback instead of
  mutating live DOM styles (fixes blank/broken PDF)
- Remove backdrop-blur from captured element (html2canvas crash fix)
- Fix share button: use URL share instead of file share (works on
  all browsers including Android & desktop)
- Add WhatsApp button: sends formatted message with order details
  and pre-fills customer phone number
- Support multi-page A4 PDF for long invoices
- Add copied-to-clipboard toast notification"

echo ""
echo "✅  Committed successfully"

# ── 5. Push ───────────────────────────────────────────────────────
echo ""
echo "⬆️   Pushing to GitHub..."
git push origin main

echo ""
echo "════════════════════════════════════════"
echo "  ✅  Done! Changes pushed to GitHub."
echo "  🚀  Cloudflare Pages will auto-deploy."
echo "════════════════════════════════════════"
echo ""
