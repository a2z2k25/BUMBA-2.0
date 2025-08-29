#!/bin/bash

# BUMBA End-to-End Test Script
# Tests all commands and verifies file creation

echo "🏁 BUMBA End-to-End Test Suite"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0

# Test function
test_command() {
    local cmd="$1"
    local description="$2"
    local check_file="$3"
    
    echo -e "\n${BLUE}Testing: ${description}${NC}"
    echo "Command: $cmd"
    
    # Run command
    eval "$cmd" > /tmp/bumba-test.log 2>&1
    
    if [ $? -eq 0 ]; then
        # Check if file was created if specified
        if [ -n "$check_file" ]; then
            if [ -f "$check_file" ] || [ -d "$check_file" ]; then
                echo -e "${GREEN}✅ PASSED - File created: $check_file${NC}"
                PASSED=$((PASSED + 1))
                # Show file content preview
                if [ -f "$check_file" ]; then
                    echo "Preview:"
                    head -5 "$check_file" | sed 's/^/  /'
                fi
            else
                echo -e "${RED}❌ FAILED - File not created: $check_file${NC}"
                FAILED=$((FAILED + 1))
            fi
        else
            echo -e "${GREEN}✅ PASSED${NC}"
            PASSED=$((PASSED + 1))
        fi
    else
        echo -e "${RED}❌ FAILED - Command error${NC}"
        cat /tmp/bumba-test.log | head -5
        FAILED=$((FAILED + 1))
    fi
}

# Change to project directory
cd "/Users/az/Claude/bumba-claude/BUMBA CLI 1.0"

echo -e "\n${YELLOW}1. Testing Terminal Commands${NC}"
echo "----------------------------------------"

# Test basic terminal commands
test_command "bumba status" "Check status" ""
test_command "bumba menu" "Show menu" ""

echo -e "\n${YELLOW}2. Testing Slash Commands${NC}"
echo "----------------------------------------"

# Test PRD creation
test_command "./bumba-slash 'prd mobile app'" "Create PRD" "docs/PRDs/mobile-app-prd.md"

# Test UI component creation
test_command "./bumba-slash 'ui Button react'" "Create UI Component" "src/components/Button/Button.jsx"

# Test API creation
test_command "./bumba-slash 'api products CRUD'" "Create API" "src/api/products/routes.js"

echo -e "\n${YELLOW}3. Testing Multi-Command Workflow${NC}"
echo "----------------------------------------"

# Test complete feature workflow
test_command "./bumba-slash 'prd authentication system'" "PRD for auth" "docs/PRDs/authentication-system-prd.md"
test_command "./bumba-slash 'ui LoginForm react'" "Login UI" "src/components/LoginForm/LoginForm.jsx"
test_command "./bumba-slash 'api auth CRUD'" "Auth API" "src/api/auth/routes.js"

echo -e "\n${YELLOW}4. Testing Error Handling${NC}"
echo "----------------------------------------"

# Test invalid commands
test_command "./bumba-slash 'invalid-command'" "Invalid command handling" ""
test_command "./bumba-slash menu" "Command without prefix" ""

echo -e "\n${YELLOW}5. Verifying File Structure${NC}"
echo "----------------------------------------"

# Check created directories
echo "Created directories:"
for dir in docs/PRDs src/components src/api; do
    if [ -d "$dir" ]; then
        echo -e "  ${GREEN}✓${NC} $dir"
        ls -la "$dir" | head -5 | sed 's/^/    /'
    else
        echo -e "  ${RED}✗${NC} $dir"
    fi
done

echo -e "\n${YELLOW}================================${NC}"
echo -e "${YELLOW}📊 Test Results${NC}"
echo -e "${YELLOW}================================${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"

# Calculate success rate
if [ $((PASSED + FAILED)) -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / (PASSED + FAILED)))
    echo -e "${BLUE}📈 Success Rate: ${SUCCESS_RATE}%${NC}"
fi

# Cleanup test files (optional)
echo -e "\n${YELLOW}Cleanup${NC}"
echo "Test files created in:"
echo "  - docs/PRDs/"
echo "  - src/components/"
echo "  - src/api/"
echo "Keep these files? (y/n)"
read -r KEEP

if [ "$KEEP" != "y" ]; then
    echo "Cleaning up test files..."
    rm -rf docs/PRDs/*.md src/components/* src/api/*
    echo "Cleanup complete"
fi

# Exit with appropriate code
if [ $FAILED -gt 0 ]; then
    exit 1
else
    exit 0
fi