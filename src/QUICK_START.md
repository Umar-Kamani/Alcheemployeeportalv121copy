# ⚡ Quick Start Guide - Fixed Version

## The error is now fixed! Follow these steps:

---

## 🔧 What Was Fixed:

1. ✅ **API Service** - Now handles `import.meta.env` safely
2. ✅ **Environment Files** - Created `.env` and `.env.example`
3. ✅ **Dockerfiles** - Properly configured for both frontend and backend
4. ✅ **Setup Scripts** - Automated the entire setup process

---

## 🚀 Get Started (3 Steps)

### Step 1: Check Your Setup
```bash
chmod +x check-setup.sh
./check-setup.sh
```

This will verify:
- ✓ Docker is running
- ✓ Environment files exist
- ✓ Configuration is correct

### Step 2: Start the Application
```bash
chmod +x start-postgres.sh
./start-postgres.sh
```

This will:
- Create environment files if missing
- Build all Docker containers
- Start PostgreSQL database
- Run database migrations
- Start backend and frontend

### Step 3: Test It!
1. Open **http://localhost:3000**
2. Login: `admin` / `admin123`
3. Add an employee
4. **Open incognito window**
5. Login again
6. ✅ **See the same employee? PostgreSQL is working!**

---

## 🐛 Error Was: `Cannot read properties of undefined (reading 'VITE_API_URL')`

### Root Cause:
The API service was trying to access `import.meta.env.VITE_API_URL` but `import.meta` was undefined in certain contexts.

### The Fix:
```typescript
// OLD (broke):
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// NEW (works):
const API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:3001/api';
```

This safely checks if `import.meta` exists before trying to access it.

---

## ✅ Verification Checklist

After running `./start-postgres.sh`, verify:

```bash
# 1. All containers running
docker-compose ps
# Should show: postgres, backend, frontend all "Up"

# 2. Backend is accessible
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}

# 3. Database has tables
docker-compose exec postgres psql -U admin -d security_app -c "\dt"
# Should show: users, employees, attendance_records, parking_config

# 4. Admin user exists
docker-compose exec postgres psql -U admin -d security_app -c "SELECT username, role FROM users;"
# Should show: admin (admin role) and dean (dean role)
```

---

## 🎯 The Critical Test

**This test proves PostgreSQL is working:**

### Test Setup:
1. **Regular Browser Window:**
   - Go to http://localhost:3000
   - Login: `admin` / `admin123`
   - Add employee: "Test User"
   - Note the employee appears

2. **Incognito/Private Window:**
   - Go to http://localhost:3000 (in incognito)
   - Login: `admin` / `admin123`
   - **Check employee list**

### Expected Result:
- ✅ **"Test User" appears in incognito window**
- This proves data is in PostgreSQL, not localStorage!

### If Failed:
- ❌ Employee doesn't appear
- This means app is still using localStorage
- Check browser console for errors (F12)
- Check if backend is running: `docker-compose ps backend`

---

## 🛠️ Troubleshooting

### Issue: "Failed to fetch" in browser

**Check backend logs:**
```bash
docker-compose logs backend
```

**Restart backend:**
```bash
docker-compose restart backend
```

---

### Issue: "relation does not exist"

**Run migration manually:**
```bash
docker-compose exec backend node dist/migrate.js
```

---

### Issue: "Connection refused"

**Check if PostgreSQL is ready:**
```bash
docker-compose ps postgres
docker-compose logs postgres
```

**Restart everything:**
```bash
docker-compose down
docker-compose up -d
sleep 15
docker-compose exec backend node dist/migrate.js
```

---

### Issue: "Cannot connect to database"

**Check environment variables:**
```bash
# Backend should have these:
docker-compose exec backend printenv | grep DB_

# Should show:
# DB_HOST=postgres
# DB_USER=admin
# DB_PASS=password123
# DB_NAME=security_app
```

**If missing, recreate backend/.env:**
```bash
cat > backend/.env << 'EOF'
DB_HOST=postgres
DB_PORT=5432
DB_USER=admin
DB_PASS=password123
DB_NAME=security_app
PORT=3001
JWT_SECRET=your-secret-jwt-key-change-in-production-12345678
EOF

docker-compose restart backend
```

---

## 📖 Additional Resources

- **Full Setup Guide:** `SETUP_POSTGRES.md`
- **Quick Reference:** `README_POSTGRES.md`
- **Diagnostic Tool:** `./diagnose.sh` (if you created it earlier)

---

## 💡 Pro Tips

### View Real-Time Logs:
```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just database
docker-compose logs -f postgres
```

### Access Database Directly:
```bash
docker-compose exec postgres psql -U admin -d security_app

# Inside PostgreSQL:
SELECT * FROM users;
SELECT * FROM employees;
SELECT * FROM attendance_records;
\q  # to exit
```

### Fresh Start (if needed):
```bash
# ⚠️ This deletes all data!
docker-compose down -v
./start-postgres.sh
```

---

## 🎉 Success!

If you can:
- ✅ Access http://localhost:3000
- ✅ Login successfully
- ✅ See data in incognito window
- ✅ Backend responds to `curl http://localhost:3001/health`

**Then congratulations! Your app is now using PostgreSQL! 🎊**

---

## 🆘 Still Having Issues?

Run the diagnostic script:
```bash
./check-setup.sh
```

Or check logs:
```bash
docker-compose logs backend | grep -i error
docker-compose logs postgres | grep -i error
```

**The error has been fixed. Just run `./start-postgres.sh` and you're good to go!** 🚀
