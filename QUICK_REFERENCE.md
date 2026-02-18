# 🚀 Quick Reference Card

## Start the Application

### Windows Quick Start
```bash
start.bat
```

### Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
npm run dev
```

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:5001/api |
| Health Check | http://localhost:5001/api/health |

## Default Login

```
Email:    admin@canadiannexus.com
Password: admin123
```

## Common Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm start            # Start server
npm run dev          # Start with auto-reload
npm run seed         # Create admin user
```

### Frontend
```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## API Endpoints Quick Reference

### Authentication
```
POST   /api/auth/signup          Create user (first = admin)
POST   /api/auth/login           Login (returns JWT)
GET    /api/auth/me              Get current user (protected)
GET    /api/auth/check-admin     Check if admin exists
```

### Admin Services (Protected - Requires JWT)
```
GET    /api/admin/services          Get all services
GET    /api/admin/services/next-id  Get next service ID
GET    /api/admin/services/:id      Get service by ID
POST   /api/admin/services          Create service
PUT    /api/admin/services/:id      Update service
DELETE /api/admin/services/:id      Delete service
```

### Public Services
```
GET    /api/services                     Get all services
GET    /api/services/:id                 Get service by ID
GET    /api/services/category/:category  Get by category
```

## Create Admin via Postman

```json
POST http://localhost:5001/api/auth/signup

{
  "email": "admin@canadiannexus.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "+1234567890"
}
```

## Create Service Example

```json
POST http://localhost:5001/api/admin/services
Authorization: Bearer YOUR_JWT_TOKEN

{
  "serviceId": 1,
  "title": "Express Entry",
  "category": "Immigration",
  "description": "Fast-track immigration for skilled workers",
  "aboutService": "Detailed information...",
  "price": "$999",
  "duration": "3-6 months",
  "rating": 4.5,
  "reviews": 120,
  "consultant": "John Doe",
  "consultantTitle": "Senior Immigration Consultant",
  "features": [
    "Document preparation",
    "Application submission",
    "Follow-up support"
  ],
  "icon": "Briefcase"
}
```

## Environment Variables

### Backend (.env in backend/)
```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/canadian-nexus
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
```

### Frontend (.env in root/)
```env
VITE_API_URL=http://localhost:5001/api
```

## Troubleshooting Quick Fixes

### MongoDB Not Running
```bash
# Windows
net start MongoDB

# Or manually
mongod
```

### Port Already in Use
```bash
# Windows - Find and kill process
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

### Clear Auth Issues
```javascript
// In browser console
localStorage.clear()
```

### Backend Won't Start
1. Check MongoDB is running
2. Verify port 5001 is free
3. Check backend/.env exists
4. Run: cd backend && npm install

### Frontend Won't Connect
1. Check backend is running
2. Clear browser cache
3. Verify .env has VITE_API_URL
4. Check browser console for errors

## File Locations

| File | Location |
|------|----------|
| Backend Server | `backend/server.js` |
| API Routes | `backend/routes/` |
| Models | `backend/models/` |
| Auth Middleware | `backend/middleware/auth.js` |
| Frontend API Client | `src/lib/api.ts` |
| Auth Page | `src/pages/Auth.tsx` |
| Services Page | `src/pages/admin/ManageServices.tsx` |
| Service Dialog | `src/components/ServiceDialog.tsx` |

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Change default admin password
- [ ] Use HTTPS in production
- [ ] Enable rate limiting
- [ ] Add input sanitization
- [ ] Use environment variables for secrets

## Helpful Links

- Setup Guide: `SETUP_INSTRUCTIONS.md`
- Full Summary: `IMPLEMENTATION_SUMMARY.md`
- Postman Collection: `Canadian_Nexus_API.postman_collection.json`

---

**Need Help?** Check SETUP_INSTRUCTIONS.md for detailed information.
