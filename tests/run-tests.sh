#!/bin/bash

echo "🧪 FitForge UI Test Suite"
echo "========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "Checking if development server is running..."
if curl -s http://localhost:5000 > /dev/null; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi

# Manual test checklist
echo ""
echo "📋 Manual Test Checklist"
echo "========================"
echo ""

tests=(
    "Button Click Tests|Can you click the theme toggle button?"
    "Button Click Tests|Do Quick Action cards respond to clicks?"
    "Button Click Tests|Does the 'Start Workout' button work?"
    "Navigation Tests|Can you navigate between Dashboard, Workouts, Progress?"
    "Navigation Tests|Does the mobile menu open on small screens?"
    "Navigation Tests|Do breadcrumbs work (if present)?"
    "Form Tests|Can you submit the login form?"
    "Form Tests|Does form validation show errors?"
    "Form Tests|Can you type in input fields?"
    "Dropdown Tests|Does the user profile dropdown open?"
    "Dropdown Tests|Can you click items in dropdowns?"
    "Modal Tests|Do any modals/dialogs open properly?"
    "Modal Tests|Can you close modals with X or Escape?"
    "Accessibility|Can you Tab through the interface?"
    "Accessibility|Do buttons show focus states?"
    "Accessibility|Can you submit forms with Enter key?"
)

passed=0
failed=0

for test in "${tests[@]}"; do
    IFS='|' read -ra TEST_PARTS <<< "$test"
    category="${TEST_PARTS[0]}"
    description="${TEST_PARTS[1]}"
    
    echo -e "\n${YELLOW}[$category]${NC}"
    echo -n "$description [y/n]: "
    read -r response
    
    if [[ "$response" == "y" ]]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((passed++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((failed++))
    fi
done

echo ""
echo "========================="
echo "Test Results Summary"
echo "========================="
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"
echo -e "Total: $((passed + failed))"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
else
    echo -e "${RED}⚠️  Some tests failed. Please investigate.${NC}"
fi

echo ""
echo "💡 Tip: Access the app at http://localhost:5000"
echo "   For WSL: http://172.22.206.209:5000"