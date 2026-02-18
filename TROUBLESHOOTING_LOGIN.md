# 🔧 Troubleshooting Guide - Admin Login Issues

## Problem: Admin Login Fails

If you're having trouble logging in to the admin panel, follow these steps:

### Step 1: Check Which Users Exist

Run this command to see all users in the database:

```bash
cd backend
npm run list-users
```

This will show you:
- All user emails
- Their roles (admin or user)
- When they were created

### Step 2: Understand the Admin Role Assignment

**IMPORTANT:** Only the **first user created** gets the admin role automatically!

If you created a user via Postman or the API before running the seed script, that first user became the admin, not the `admin@canadiannexus.com` user.

### Step 3: Solutions

#### Solution A: Make the Standard Admin User an Admin (Recommended)

If you want to use `admin@canadiannexus.com` as documented:

```bash
cd backend
npm run make-admin
```

This will:
- Update `admin@canadiannexus.com` to have admin role
- Allow you to log in with the documented credentials

**Login Credentials:**
- Email: `admin@canadiannexus.com`
- Password: `admin123`

#### Solution B: Use Your Original Admin User

If a different user was created first and has admin role, use that email instead.

Example from your case:
- Email: `subarna.kyptronix@gmail.com`
- Password: (whatever you used when creating this user)

#### Solution C: Reset Everything

If you want to start fresh:

```bash
# Connect to MongoDB
mongosh

# Switch to the database
use canadian-nexus

# Delete all users
db.users.deleteMany({})

# Exit mongosh
exit

# Now run the seed script
cd backend
npm run seed
```

This creates a fresh admin user with:
- Email: `admin@canadiannexus.com`
- Password: `admin123`

### Common Login Errors

#### Error: "Invalid email or password"

**Causes:**
1. Wrong email address
2. Wrong password
3. User doesn't exist
4. Password was changed

**Fix:**
- Run `npm run list-users` to verify the email
- Try resetting the password (see Solution C)
- Make sure you're using the correct credentials

#### Error: "Access denied. Admin privileges required."

**Cause:** The user exists but doesn't have admin role.

**Fix:**
- Run `npm run make-admin` to give admin role to `admin@canadiannexus.com`
- Or use the email of the user who has admin role (the first user created)

#### Error: "Invalid or expired token"

**Causes:**
1. JWT token expired (default: 7 days)
2. JWT_SECRET was changed
3. Browser cache issue

**Fix:**
```javascript
// In browser console (F12)
localStorage.clear()
// Then reload and try logging in again
```

### Verification Steps

After applying a solution, verify it works:

1. **Check user exists and has admin role:**
   ```bash
   cd backend
   npm run list-users
   ```
   
   Should show:
   ```
   Email: admin@canadiannexus.com
   Role: admin
   ```

2. **Try logging in via API (Postman/curl):**
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@canadiannexus.com","password":"admin123"}'
   ```
   
   Should return a JWT token and user object.

3. **Try logging in via frontend:**
   - Open http://localhost:3001
   - Enter credentials
   - Should redirect to dashboard

### Additional Helpful Scripts

#### List All Users
```bash
cd backend
npm run list-users
```

#### Make User an Admin
```bash
cd backend
npm run make-admin
```

#### Create Fresh Admin
```bash
cd backend
npm run seed
```

### MongoDB Connection Issues

If scripts can't connect to MongoDB:

```bash
# Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe"

# If not running, start it
net start MongoDB

# Or manually
mongod
```

### Backend Not Running

Make sure the backend is running:

```bash
cd backend
npm start
```

Should see:
```
🚀 Server is running on port 5001
📡 API endpoint: http://localhost:5001/api
✅ MongoDB connected successfully
```

## Summary of Credentials

### Default Admin (After running make-admin or fresh seed)
- **Email:** admin@canadiannexus.com
- **Password:** admin123

### Your Custom Admin (If you created one first)
- **Email:** (the first email you used to signup)
- **Password:** (the password you set)

## Need More Help?

1. Check backend logs for error messages
2. Check browser console (F12) for frontend errors
3. Verify MongoDB is running and accessible
4. Make sure backend is running on port 5001
5. Make sure frontend is running on port 3001

---

**Pro Tip:** After successfully logging in, **change your password immediately** for security!
