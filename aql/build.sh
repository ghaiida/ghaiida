#!/bin/sh
# Assemble the single-page game from its parts.
cd "$(dirname "$0")"
JS="10-core.js 11-engine.js 12-content.js 20-mech-build1.js 21-mech-grid.js 30-mech-loop-if.js 31-mech-var-io-bugs.js 32-final.js 40-screens.js 50-teacher.js"
cat $JS > /tmp/aql-all.js && node --check /tmp/aql-all.js || exit 1
{ cat 01-head.html 02-style.html 03-style.html; echo '<script>'; cat /tmp/aql-all.js; echo 'start();'; echo '</script>'; } > ../aql.html
wc -c ../aql.html
