#!/bin/bash
# Quick setup script for GMARK

echo "🔖 GMARK - Quick Setup"
echo "======================"

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install fastapi uvicorn pydantic loguru requests beautifulsoup4 openai python-decouple pyjwt passlib[bcrypt] fastapi-utils peewee httpx fire tqdm

# Create database
echo ""
echo "🗄️  Setting up database..."
if [ -f "gmark.db" ]; then
    echo "⚠️  Database already exists. Running migration..."
    python3 migrate_db.py
else
    echo "Creating fresh database..."
    sqlite3 gmark.db < assets/data.sql
fi

# Create .env file
echo ""
echo "⚙️  Setting up environment..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ Created .env file - please edit with your API keys!"
else
    echo "⚠️  .env already exists, skipping..."
fi

# Create directory structure
mkdir -p static logs

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys (optional)"
echo "2. Run: source venv/bin/activate"
echo "3. Start server: cd gmark && uvicorn app:app --reload"
echo "4. Open Chrome AI demo: http://localhost:8000/../static/chrome-ai-demo.html"
echo ""
echo "📚 See README_NEW.md for full documentation"
