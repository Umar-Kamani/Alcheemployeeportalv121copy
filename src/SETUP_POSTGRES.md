# 🗄️ PostgreSQL Setup Guide

## Converting Your App from localStorage to PostgreSQL

This guide will help you migrate your Security Post Attendance App from using browser localStorage to a PostgreSQL database.

---

## ✅ Prerequisites

Before you start, make sure you have:

- [x] Docker installed and running
- [x] Docker Compose installed  
- [x] Ports 3000, 3001, and 5432 available

**Verify Docker:**
```bash
docker --version
docker-compose --version
docker info
```

---

## 🚀 Quick Start

### Option 1: Use the Start Script (Easiest)

```bash
# Make the script executable
chmod +x start-postgres.sh

# Run it
./start-postgres.sh
```

### Option 2: Manual Steps

```bash
# 1. Build and start all containers
docker-compose up --build -d

# 2. Wait for PostgreSQL to be ready
sleep 10

# 3. Run database migrations
docker-compose exec backend node dist/migrate.js

# 4. Access the app
# Open browser to: http://localhost:3000
```

---

## 🧪 Testing the Migration

### The Critical Test: Multi-Browser Data Sharing

This is THE test that proves PostgreSQL is working instead of localStorage!

1. **Browser 1 (Regular Window):**
   - Go to http://localhost:3000
   - Login as `admin` / `admin123`
   - Add an employee: Name="Test Employee", ID="TEST001"

2. **Browser 2 (Incognito/Private Window):**
   - Go to http://localhost:3000
   - Login as `admin` / `admin123` again
   - **✅ EXPECTED:** You see "Test Employee" in the list!
   - **❌ OLD BEHAVIOR (localStorage):** The list would be empty

3. **If you see the employee in incognito → PostgreSQL is working! 🎉**

### Additional Tests:

**Test Data Persistence:**
```bash
# 1. Add some data in the app
# 2. Close browser and clear cache
# 3. Reopen browser
# 4. Login again
# ✅ Expected: Data is still there
```

**Test Database Directly:**
```bash
# Connect to database
docker-compose exec postgres psql -U admin -d security_app

# View users
SELECT username, role FROM users;

# View employees
SELECT * FROM employees;

# View attendance
SELECT * FROM attendance_records;

# Exit
\q
```

---

## 📊 What Changed?

### Before (localStorage):
```
Browser → localStorage
  ❌ Data isolated per browser
  ❌ Lost when cache cleared
  ❌ No multi-user support
```

### After (PostgreSQL):
```
Browser → Backend API → PostgreSQL Database
  ✅ Centralized data storage
  ✅ Persistent across browsers
  ✅ True multi-user support
```

---

## 🗄️ Database Schema

Your PostgreSQL database has 4 tables:

### 1. **users**
```sql
- id (PRIMARY KEY)
- username (UNIQUE)
- password (bcrypt hashed)
- role (admin, security, hr, dean)
- created_at
```

### 2. **employees**
```sql
- id (PRIMARY KEY)
- name
- employee_id (UNIQUE)
- department
- position
- vehicle_plate_number
- created_at
```

### 3. **attendance_records**
```sql
- id (PRIMARY KEY)
- employee_id (FOREIGN KEY → employees.id)
- employee_name
- date
- time_in
- time_out
- plate_number
- is_guest
- guest_purpose
- created_at
```

### 4. **parking_config**
```sql
- id (PRIMARY KEY)
- total_spaces
- occupied_spaces
- updated_at
```

---

## 🔑 Default Users

After migration, these users are created:

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| admin | admin123 | Super Admin | Full access + user management |
| dean | dean123 | Dean | Read-only analytics |

**⚠️ Change these passwords immediately in production!**

---

## 📡 API Endpoints

All endpoints (except login) require JWT token in Authorization header:

### Authentication
- `POST /api/auth/login` - Login and get JWT token

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `POST /api/users/:id/reset-password` - Reset password
- `DELETE /api/users/:id` - Delete user

### Employees
- `GET /api/employees` - List all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance?startDate=X&endDate=Y` - List records
- `POST /api/attendance` - Mark entry
- `PUT /api/attendance/:id` - Mark exit
- `DELETE /api/attendance/:id` - Delete record

### Parking
- `GET /api/parking` - Get parking configuration
- `PUT /api/parking` - Update parking configuration

---

## 🛠️ Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just database
docker-compose logs -f postgres
```

### Stop/Restart
```bash
# Stop all services
docker-compose down

# Restart all services
docker-compose restart

# Restart just backend
docker-compose restart backend
```

### Database Management
```bash
# Access PostgreSQL CLI
docker-compose exec postgres psql -U admin -d security_app

# Backup database
docker-compose exec postgres pg_dump -U admin security_app > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U admin security_app
```

### Fresh Start
```bash
# ⚠️ This deletes ALL data!
docker-compose down -v
docker-compose up --build -d
sleep 10
docker-compose exec backend node dist/migrate.js
```

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" error when logging in

**Diagnosis:**
```bash
# Check if backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Test backend health
curl http://localhost:3001/health
```

**Solutions:**
- Backend not running: `docker-compose up -d backend`
- Database connection failed: `docker-compose restart postgres && docker-compose restart backend`
- Migration didn't run: `docker-compose exec backend node dist/migrate.js`

---

### Issue: Backend shows database connection error

**Diagnosis:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test database connection
docker-compose exec postgres pg_isready -U admin
```

**Solutions:**
- PostgreSQL not ready: Wait 10 seconds and try again
- Wrong credentials: Check `docker-compose.yml` and `backend/.env` match

---

### Issue: "relation does not exist" errors

**Cause:** Migration didn't create the tables

**Solution:**
```bash
# Run migration manually
docker-compose exec backend node dist/migrate.js

# Check if tables were created
docker-compose exec postgres psql -U admin -d security_app -c "\dt"
```

---

### Issue: Can't access from browser

**Check:**
1. Is frontend container running? `docker-compose ps frontend`
2. Can you access backend? `curl http://localhost:3001/health`
3. Check browser console for errors (F12)

**Solutions:**
- Restart frontend: `docker-compose restart frontend`
- Rebuild frontend: `docker-compose up --build -d frontend`
- Check .env file has correct `VITE_API_URL=http://localhost:3000/api`

---

## 🌐 Production Deployment

### Environment Variables

**Frontend (.env):**
```bash
VITE_API_URL=https://your-domain.com/api
```

**Backend (backend/.env):**
```bash
DB_HOST=your-database-host
DB_PORT=5432
DB_USER=your-db-user
DB_PASS=strong-password-here
DB_NAME=security_app
PORT=3001
JWT_SECRET=generate-a-long-random-secret-key
```

### Security Checklist

- [ ] Change default admin password
- [ ] Change default dean password
- [ ] Set strong JWT_SECRET
- [ ] Use strong database password
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up regular database backups
- [ ] Update CORS settings in backend
- [ ] Use environment-specific .env files
- [ ] Never commit .env files to git

---

## 📝 What's Different in the Code

### App.tsx
- ✅ Now uses `services/api.ts` for all backend calls
- ✅ All data operations are async
- ✅ Added loading states
- ✅ Added error handling
- ✅ Data transforms between backend (snake_case) and frontend (camelCase)

### LoginPage.tsx
- ✅ Calls backend API for authentication
- ✅ Stores JWT token in localStorage
- ✅ Added loading state during login

### New Files
- ✅ `services/api.ts` - API service layer
- ✅ `docker-compose.yml` - Container orchestration
- ✅ `Dockerfile` - Frontend container
- ✅ `backend/Dockerfile` - Backend container
- ✅ `.env` - Frontend configuration
- ✅ `backend/.env` - Backend configuration

---

## ✅ Success Checklist

Your PostgreSQL integration is successful if:

- [ ] App starts without errors
- [ ] Can login with admin/admin123
- [ ] Data appears in incognito window (CRITICAL TEST!)
- [ ] Data persists after browser restart
- [ ] Backend health check returns OK: `curl http://localhost:3001/health`
- [ ] Can view data in database: `docker-compose exec postgres psql -U admin -d security_app`
- [ ] Can add employees through UI
- [ ] Can mark attendance through UI
- [ ] All changes save to database

---

## 🎉 Next Steps

After successful setup:

1. ✅ Test all features thoroughly
2. ✅ Change default passwords
3. ✅ Create additional users (security guards, HR staff)
4. ✅ Import your employee data
5. ✅ Set up regular database backups
6. ✅ Configure production environment
7. ✅ Deploy to production server

---

## 💡 Pro Tips

1. **Regular Backups:**
   ```bash
   # Create backup script
   docker-compose exec postgres pg_dump -U admin security_app > backup-$(date +%Y%m%d).sql
   ```

2. **Monitor Database:**
   ```bash
   # Watch database size
   docker-compose exec postgres psql -U admin -d security_app -c "SELECT pg_size_pretty(pg_database_size('security_app'));"
   ```

3. **View Recent Activity:**
   ```bash
   # Recent attendance records
   docker-compose exec postgres psql -U admin -d security_app -c "SELECT * FROM attendance_records ORDER BY created_at DESC LIMIT 10;"
   ```

---

**Congratulations! Your app now uses PostgreSQL for persistent, centralized data storage! 🎉**
