# ✅ Setup Checklist

## Follow this checklist to ensure everything is ready:

---

## 📋 Pre-Flight Checks

### 1. Docker Setup
- [ ] Docker Desktop is installed
- [ ] Docker is running (`docker info` works)
- [ ] Docker Compose is available (`docker-compose --version` works)

### 2. Files Exist
- [ ] `.env` file exists in root directory
- [ ] `backend/.env` file exists
- [ ] `docker-compose.yml` exists
- [ ] `services/api.ts` exists
- [ ] `start-postgres.sh` exists

### 3. Ports Available
- [ ] Port 3000 is free (frontend)
- [ ] Port 3001 is free (backend)
- [ ] Port 5432 is free (PostgreSQL)

**Check ports:**
```bash
# On Mac/Linux:
lsof -i :3000
lsof -i :3001
lsof -i :5432

# On Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432
```

---

## 🚀 Setup Steps

### Step 1: Make Scripts Executable
```bash
chmod +x start-postgres.sh
chmod +x check-setup.sh
```
- [ ] Scripts are executable

### Step 2: Run Pre-Flight Check
```bash
./check-setup.sh
```
- [ ] All checks pass
- [ ] No red ✗ marks

### Step 3: Start Application
```bash
./start-postgres.sh
```
- [ ] All containers build successfully
- [ ] PostgreSQL starts
- [ ] Backend starts
- [ ] Frontend starts
- [ ] Migration completes

---

## ✅ Verification Steps

### 1. Check Container Status
```bash
docker-compose ps
```
**Expected output:**
```
NAME                STATUS
security-postgres   Up
security-backend    Up
security-frontend   Up
```
- [ ] All 3 containers are "Up"

### 2. Test Backend Health
```bash
curl http://localhost:3001/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`
- [ ] Backend responds with OK

### 3. Check Database
```bash
docker-compose exec postgres psql -U admin -d security_app -c "\dt"
```
**Expected:** Shows 4 tables (users, employees, attendance_records, parking_config)
- [ ] All 4 tables exist

### 4. Check Default Users
```bash
docker-compose exec postgres psql -U admin -d security_app -c "SELECT username, role FROM users;"
```
**Expected:** Shows admin and dean users
- [ ] Admin user exists
- [ ] Dean user exists

### 5. Test Frontend
- [ ] Open http://localhost:3000 in browser
- [ ] Login page loads with VUCUE logo
- [ ] No errors in browser console (F12)

### 6. Test Login
- [ ] Enter username: `admin`
- [ ] Enter password: `admin123`
- [ ] Click Login
- [ ] Dashboard loads successfully
- [ ] No "Failed to fetch" errors

---

## 🎯 The Critical Test (PostgreSQL Proof)

### Test: Multi-Browser Data Sharing

**This proves your data is in PostgreSQL, not localStorage!**

#### Step 1: Add Data (Regular Browser)
- [ ] Login as admin
- [ ] Go to Employee Management
- [ ] Add employee: "Test Employee"
- [ ] Employee appears in list

#### Step 2: Check Data (Incognito Window)
- [ ] Open new incognito/private window
- [ ] Go to http://localhost:3000
- [ ] Login as admin again
- [ ] Go to Employee Management
- [ ] **CRITICAL:** Do you see "Test Employee"?

#### Result:
- [ ] ✅ YES - I see "Test Employee" in incognito
  - **SUCCESS!** PostgreSQL is working!
- [ ] ❌ NO - I don't see "Test Employee"
  - Check browser console for errors
  - Check backend logs: `docker-compose logs backend`
  - Verify backend is accessible: `curl http://localhost:3001/health`

---

## 🐛 Troubleshooting

### If Any Step Fails:

#### Container won't start?
```bash
# Check logs
docker-compose logs [postgres/backend/frontend]

# Try rebuilding
docker-compose down
docker-compose up --build -d
```

#### Migration failed?
```bash
# Run manually
docker-compose exec backend node dist/migrate.js
```

#### Backend can't connect to database?
```bash
# Check if PostgreSQL is ready
docker-compose exec postgres pg_isready -U admin

# Restart in order
docker-compose restart postgres
sleep 10
docker-compose restart backend
```

#### Frontend shows errors?
```bash
# Check browser console (F12)
# Check if backend is accessible
curl http://localhost:3001/health

# Rebuild frontend
docker-compose up --build -d frontend
```

---

## 📊 Final Verification

When everything is working, you should have:

### Containers:
- [ ] 3 containers running (postgres, backend, frontend)
- [ ] All containers status: "Up"
- [ ] No containers in "Restarting" state

### Backend:
- [ ] Health check returns OK
- [ ] Can login via API
- [ ] Logs show "Server running on port 3001"
- [ ] No error messages in logs

### Database:
- [ ] PostgreSQL accepting connections
- [ ] 4 tables created
- [ ] 2 default users (admin, dean)
- [ ] Default parking config inserted

### Frontend:
- [ ] Accessible at http://localhost:3000
- [ ] Login page loads
- [ ] Can authenticate
- [ ] Dashboard loads after login
- [ ] Data persists across browsers

### The Critical Test:
- [ ] **Data appears in incognito window**
  - This is THE test that proves PostgreSQL is working!

---

## 🎉 Success Criteria

You're ready to use the app when:

- [x] All containers running
- [x] Backend health check passes
- [x] Database has tables and users
- [x] Can login successfully
- [x] **Data appears in incognito window** ← MOST IMPORTANT!

---

## 📞 If You're Stuck

1. **Run diagnostic:**
   ```bash
   ./check-setup.sh
   ```

2. **Check logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Fresh start:**
   ```bash
   docker-compose down -v
   ./start-postgres.sh
   ```

4. **Read documentation:**
   - `ERROR_FIXED.md` - Error resolution
   - `QUICK_START.md` - Quick start guide
   - `SETUP_POSTGRES.md` - Full setup guide

---

## ✅ All Done!

Once all checkboxes are checked, your Security Post Attendance App is:
- ✅ Using PostgreSQL for data storage
- ✅ Supporting multiple users simultaneously
- ✅ Persisting data across browser sessions
- ✅ Ready for production use!

**Now go track some attendance! 📋✨**
