#!/bin/bash

# BUMBA Emoji Standardization Script
# Updates all emojis to use only the allowed set: 🔴 🟠 🟡 🟢 🏁

echo "Standardizing emojis across BUMBA framework..."
echo "Allowed emojis: 🔴 🟠 🟡 🟢 🏁"
echo ""

# Count current usage
echo "Current emoji usage:"
grep -r "🚀\|🔧\|🎨\|📊\|🧪\|⚙️\|✨\|💡\|📈\|✓\|✗\|⚠\|ℹ\|●\|○\|▶\|■\|⏸\|⭐\|🎉\|🔥\|🌟\|💪\|🛡️\|⚡\|🎭\|🔮\|🌈\|🧠\|🚨\|💾\|🔀\|🧹\|🏗️\|🔄\|📁\|🎵\|🎶\|♪\|🎯\|🌊\|🎪\|🎮\|🍃\|🌺\|🌀\|🎸\|🥁\|🌍\|🌙\|⚖️\|📜\|🔒\|🔑\|💼\|📦\|📋\|📄\|📝\|🗂️\|🔍\|🔎\|📌\|📍" src --include="*.js" --include="*.md" 2>/dev/null | wc -l
echo ""

# Replacement mappings
# Technical/System -> 🟢
# Warning/Caution -> 🟠  
# Error/Stop -> 🔴
# Progress/Working -> 🟡
# Complete/Success -> 🏁

echo "Updating JavaScript files..."

# Update JavaScript files
find src -name "*.js" -type f -exec sed -i.bak \
  -e 's/🚀/🏁/g' \
  -e 's/🔧/🟢/g' \
  -e 's/🎨/🔴/g' \
  -e 's/📊/🟡/g' \
  -e 's/🧪/🟠/g' \
  -e 's/⚙️/🟢/g' \
  -e 's/✨/🏁/g' \
  -e 's/💡/🟡/g' \
  -e 's/📈/🟡/g' \
  -e 's/✓/🟢/g' \
  -e 's/✗/🔴/g' \
  -e 's/⚠/🟠/g' \
  -e 's/ℹ/🟡/g' \
  -e 's/●/🟢/g' \
  -e 's/○/⭕/g' \
  -e 's/▶/🟢/g' \
  -e 's/■/🔴/g' \
  -e 's/⏸/🟡/g' \
  -e 's/⭐/🏁/g' \
  -e 's/🎉/🏁/g' \
  -e 's/🔥/🔴/g' \
  -e 's/🌟/🏁/g' \
  -e 's/💪/🟢/g' \
  -e 's/🛡️/🟢/g' \
  -e 's/⚡/🟡/g' \
  -e 's/🎭/🟡/g' \
  -e 's/🔮/🟡/g' \
  -e 's/🌈/🏁/g' \
  -e 's/🧠/🟡/g' \
  -e 's/🚨/🔴/g' \
  -e 's/💾/🟢/g' \
  -e 's/🔀/🟡/g' \
  -e 's/🧹/🟢/g' \
  -e 's/🏗️/🟡/g' \
  -e 's/🔄/🟡/g' \
  -e 's/📁/🟢/g' \
  -e 's/🎵/🏁/g' \
  -e 's/🎶/🏁/g' \
  -e 's/♪/🏁/g' \
  -e 's/🎯/🏁/g' \
  -e 's/🌊/🟡/g' \
  -e 's/🎪/🏁/g' \
  -e 's/🎮/🏁/g' \
  -e 's/🍃/🟢/g' \
  -e 's/🌺/🔴/g' \
  -e 's/🌀/🟡/g' \
  -e 's/🎸/🏁/g' \
  -e 's/🥁/🏁/g' \
  -e 's/🌍/🟢/g' \
  -e 's/🌙/🟡/g' \
  -e 's/⚖️/🟡/g' \
  -e 's/📜/🟡/g' \
  -e 's/🔒/🟢/g' \
  -e 's/🔑/🟢/g' \
  -e 's/💼/🟡/g' \
  -e 's/📦/🟢/g' \
  -e 's/📋/🟡/g' \
  -e 's/📄/🟡/g' \
  -e 's/📝/🟡/g' \
  -e 's/🗂️/🟢/g' \
  -e 's/🔍/🟡/g' \
  -e 's/🔎/🟡/g' \
  -e 's/📌/🔴/g' \
  -e 's/📍/🔴/g' \
  {} \;

echo "Updating Markdown files..."

# Update Markdown files  
find . -name "*.md" -type f -not -path "./node_modules/*" -not -path "./.git/*" -exec sed -i.bak \
  -e 's/🚀/🏁/g' \
  -e 's/🔧/🟢/g' \
  -e 's/🎨/🔴/g' \
  -e 's/📊/🟡/g' \
  -e 's/🧪/🟠/g' \
  -e 's/⚙️/🟢/g' \
  -e 's/✨/🏁/g' \
  -e 's/💡/🟡/g' \
  -e 's/✅/🟢/g' \
  -e 's/❌/🔴/g' \
  -e 's/⚠️/🟠/g' \
  -e 's/💪/🟢/g' \
  -e 's/🎉/🏁/g' \
  -e 's/🔥/🔴/g' \
  -e 's/🌟/🏁/g' \
  -e 's/🛡️/🟢/g' \
  -e 's/⚡/🟡/g' \
  -e 's/🚨/🔴/g' \
  -e 's/🎯/🏁/g' \
  {} \;

# Clean up backup files
echo "Cleaning up backup files..."
find . -name "*.bak" -type f -delete

echo ""
echo "🏁 Emoji standardization complete!"
echo ""
echo "New emoji usage count:"
grep -r "🔴\|🟠\|🟡\|🟢\|🏁" src --include="*.js" --include="*.md" 2>/dev/null | wc -l