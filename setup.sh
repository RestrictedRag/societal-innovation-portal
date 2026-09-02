#!/bin/bash

# CivicNexus - 1-Click Local Setup Script for Linux/macOS
set -e

echo "======================================================="
echo "   CivicNexus - Local Environment Setup"
echo "   SIH 2026 Innovation Platform"
echo "======================================================="
echo ""

node setup-local.js

echo ""
read -p "Do you want to start CivicNexus now? (y/n): " START_NOW
if [[ "$START_NOW" =~ ^[Yy]$ ]]; then
    echo "Starting CivicNexus dev server..."
    npm run dev
else
    echo "You can start the app anytime with: npm run dev"
fi
