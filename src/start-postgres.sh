#!/bin/bash

echo "🚀 Starting Security Post Attendance App with PostgreSQL"
echo "=========================================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
fi

# Check if backend/.env file exists
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env file..."
    cat > backend/.env << 'EOF'
DB_HOST=postgres
DB_PORT=5432
DB_USER=admin
DB_PASS=password123
DB_NAME=security_app
PORT=3001
JWT_SECRET=your-secret-jwt-key-change-in-production-12345678
EOF
fi

echo "🧹 Cleaning up old containers..."
docker-compose down

echo ""
echo "🐳 Building and starting Docker containers..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 15

echo ""
echo "🔄 Running database migrations..."
docker-compose exec -T backend node dist/migrate.js

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================================="
    echo "✅ Application started successfully!"
    echo ""
    echo "📍 Access Points:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:3001"
    echo "   Database:  localhost:5432"
    echo ""
    echo "🔑 Default Login Credentials:"
    echo "   Super Admin - Username: admin, Password: admin123"
    echo "   Dean        - Username: dean,  Password: dean123"
    echo ""
    echo "⚠️  IMPORTANT: Change these passwords in production!"
    echo ""
    echo "📖 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop application:"
    echo "   docker-compose down"
    echo "=========================================================="
else
    echo ""
    echo "⚠️  Migration failed. Checking logs..."
    docker-compose logs backend
fi
