#!/bin/bash

echo "🔍 Security Post App - Setup Checker"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES=0

# Check 1: Docker
echo "1. Checking Docker..."
if docker info > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Docker is running"
else
    echo -e "${RED}✗${NC} Docker is not running"
    echo "   Solution: Start Docker Desktop"
    ((ISSUES++))
fi

# Check 2: .env files
echo ""
echo "2. Checking environment files..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} Frontend .env exists"
    grep -q "VITE_API_URL" .env && echo "   API URL: $(grep VITE_API_URL .env | cut -d '=' -f 2)"
else
    echo -e "${RED}✗${NC} Frontend .env missing"
    echo "   Solution: cp .env.example .env"
    ((ISSUES++))
fi

if [ -f backend/.env ]; then
    echo -e "${GREEN}✓${NC} Backend .env exists"
else
    echo -e "${RED}✗${NC} Backend .env missing"
    echo "   Solution: See SETUP_POSTGRES.md"
    ((ISSUES++))
fi

# Check 3: Docker Compose file
echo ""
echo "3. Checking docker-compose.yml..."
if [ -f docker-compose.yml ]; then
    echo -e "${GREEN}✓${NC} docker-compose.yml exists"
else
    echo -e "${RED}✗${NC} docker-compose.yml missing"
    ((ISSUES++))
fi

# Check 4: Services (if docker-compose exists)
if [ -f docker-compose.yml ] && docker info > /dev/null 2>&1; then
    echo ""
    echo "4. Checking running services..."
    
    # Check Postgres
    if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}✓${NC} PostgreSQL is running"
    else
        echo -e "${YELLOW}⚠${NC} PostgreSQL is not running"
        echo "   Run: docker-compose up -d postgres"
    fi
    
    # Check Backend
    if docker-compose ps backend 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}✓${NC} Backend is running"
    else
        echo -e "${YELLOW}⚠${NC} Backend is not running"
        echo "   Run: docker-compose up -d backend"
    fi
    
    # Check Frontend
    if docker-compose ps frontend 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}✓${NC} Frontend is running"
    else
        echo -e "${YELLOW}⚠${NC} Frontend is not running"
        echo "   Run: docker-compose up -d frontend"
    fi
fi

# Check 5: Backend health (if running)
echo ""
echo "5. Checking backend connectivity..."
HEALTH=$(curl -s http://localhost:3001/health 2>/dev/null)
if [ -n "$HEALTH" ]; then
    echo -e "${GREEN}✓${NC} Backend is accessible"
    echo "   Response: $HEALTH"
else
    echo -e "${YELLOW}⚠${NC} Backend is not accessible"
    echo "   This is normal if containers aren't started yet"
fi

# Summary
echo ""
echo "====================================="
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Setup looks good!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./start-postgres.sh"
    echo "  2. Open: http://localhost:3000"
    echo "  3. Login with: admin / admin123"
else
    echo -e "${RED}⚠️  Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Please fix the issues above and try again."
fi
echo "====================================="
