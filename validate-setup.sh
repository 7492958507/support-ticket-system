#!/bin/bash
# Quick validation script for the Support Ticket System

echo "============================================"
echo "Support Ticket System - Setup Validation"
echo "============================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
else
    echo "✅ Docker is installed: $(docker --version)"
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
else
    echo "✅ Docker Compose is installed"
fi

echo ""
echo "Project structure check:"
echo ""

# Check key files exist
files=(
    "docker-compose.yml"
    "README.md"
    "backend/requirements.txt"
    "backend/Dockerfile"
    "backend/manage.py"
    "backend/config/settings.py"
    "backend/tickets/models.py"
    "backend/tickets/views.py"
    "backend/tickets/llm_service.py"
    "frontend/Dockerfile"
    "frontend/package.json"
    "frontend/src/App.js"
    "frontend/src/components/TicketForm.js"
    "frontend/src/components/TicketList.js"
    "frontend/src/components/Stats.js"
)

all_good=true
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (MISSING)"
        all_good=false
    fi
done

echo ""
if [ "$all_good" = true ]; then
    echo "✅ All required files are present!"
    echo ""
    echo "Next steps:"
    echo "1. Create .env file with your LLM API key (optional):"
    echo "   cp .env.example .env"
    echo "   # Edit .env and add your Anthropic API key"
    echo ""
    echo "2. Start the application:"
    echo "   docker-compose up --build"
    echo ""
    echo "3. Access the application:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000/api/tickets/"
else
    echo "❌ Some files are missing. Please check the project structure."
    exit 1
fi
