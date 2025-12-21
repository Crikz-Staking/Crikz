#!/bin/bash

OUTPUT_FILE="project-export.txt"

echo "# PROJECT STRUCTURE" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

tree -I 'node_modules|.git|dist|build|coverage|.next|.cache|artifacts|*.log' >> "$OUTPUT_FILE" 2>/dev/null || find . -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/build/*' >> "$OUTPUT_FILE"

echo -e "\n\n================================================================================\n# FILE CONTENTS\n================================================================================\n" >> "$OUTPUT_FILE"

find . -type f \
  -not -path '*/node_modules/*' \
  -not -path '*/.git/*' \
  -not -path '*/dist/*' \
  -not -path '*/build/*' \
  -not -path '*/coverage/*' \
  -not -path '*/.next/*' \
  -not -path '*/artifacts/*' \
  -not -path '*/*.log' \
  -not -name 'package-lock.json' \
  -not -name 'yarn.lock' \
  | while read file; do
    echo -e "\n================================================================================\nFILE: $file\n================================================================================" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE" 2>/dev/null || echo "[Binary or unreadable file]" >> "$OUTPUT_FILE"
done

echo "✅ Project exported to $OUTPUT_FILE"