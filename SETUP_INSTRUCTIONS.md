# Canadian Nexus Admin Panel - Setup Instructions

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The backend `.env` file is already configured at `backend/.env`:

```env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/canadian-nexus
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2024
```

**Important:** Change the `JWT_SECRET` in production!

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Windows (if MongoDB is installed as a service)
net start MongoDB

# Or start it manually
mongod
```

### 4. Create the First Admin User

You have two options:

#### Option A: Using the Seed Script (Recommended)

```bash
cd backend
npm run seed
```

This will create an admin user with:
- **Email:** admin@canadiannexus.com
- **Password:** admin123

⚠️ **Change the password after first login!**

#### Option B: Using Postman or curl

Send a POST request to `http://localhost:5001/api/auth/signup` with this JSON body:

```json
{
  "email": "admin@canadiannexus.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "+1234567890"
}
```

The first user created will automatically be assigned the admin role.

### 5. Start the Backend Server

```bash
cd backend
npm start
```

The server will run on **http://localhost:5001**

You should see:
```
🚀 Server is running on port 5001
📡 API endpoint: http://localhost:5001/api
✅ MongoDB connected successfully
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd ..  # Go back to project root
npm install
```

### 2. Configure Environment Variables

The frontend `.env` file is already configured at the project root:

```env
VITE_API_URL=http://localhost:5001/api
```

### 3. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will run on **http://localhost:3001**

## Accessing the Admin Panel

1. Open your browser and go to **http://localhost:3001**
2. You'll be redirected to the login page
3. Log in with:
   - **Email:** admin@canadiannexus.com
   - **Password:** admin123

## API Endpoints

### Authentication Endpoints

- **POST** `/api/auth/login` - Admin login
- **POST** `/api/auth/signup` - Create new user (first user becomes admin)
- **GET** `/api/auth/me` - Get current user details (requires auth)
- **GET** `/api/auth/check-admin` - Check if admin exists

### Service Endpoints (Public)

- **GET** `/api/services` - Get all services
- **GET** `/api/services/:id` - Get service by ID
- **GET** `/api/services/category/:category` - Get services by category

### Admin Service Endpoints (Protected - Admin Only)

- **GET** `/api/admin/services` - Get all services
- **GET** `/api/admin/services/:id` - Get service by ID
- **GET** `/api/admin/services/next-id` - Get next available service ID
- **POST** `/api/admin/services` - Create new service
- **PUT** `/api/admin/services/:id` - Update service
- **DELETE** `/api/admin/services/:id` - Delete service

## Service Data Structure

When creating or updating a service, use this structure:

```json
{
  "serviceId": 1,
  "title": "Express Entry",
  "category": "Immigration",
  "description": "Fast-track immigration for skilled workers",
  "aboutService": "Detailed information about the service...",
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

## Troubleshooting

### MongoDB Connection Error

If you see "MongoDB connection error":
- Make sure MongoDB is running
- Check if the connection string in `backend/.env` is correct
- Verify MongoDB is accessible on `localhost:27017`

### Port Already in Use

If port 5001 or 3000 is already in use:

**Backend:**
- Change `PORT` in `backend/.env`
- Update `VITE_API_URL` in frontend `.env`

**Frontend:**
- Kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  ```

### Authentication Errors

If you get "Invalid or expired token":
- Clear browser localStorage
- Log in again
- Make sure the JWT_SECRET matches in backend

### CORS Errors

If you see CORS errors:
- Check that the frontend URL is in the CORS configuration in `backend/server.js`
- Default allowed origins: `http://localhost:3000`, `http://localhost:5173`, `http://localhost:8081`, `http://localhost:8080`

## Development Scripts

### Backend

```bash
npm start          # Start backend server
npm run dev        # Start backend with nodemon (auto-reload)
npm run seed       # Create first admin user
```

### Frontend

```bash
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

## Project Structure

```
├── backend/
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Auth middleware
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts
│   ├── server.js         # Main server file
│   ├── package.json
│   └── .env
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── lib/             # Utilities (API client)
│   └── ...
├── .env                 # Frontend environment variables
└── package.json
```

## Security Notes

1. **Change the JWT_SECRET** in production
2. **Change the default admin password** immediately after first login
3. **Use HTTPS** in production
4. **Add rate limiting** for API endpoints in production
5. **Validate and sanitize** all user inputs
6. **Use environment variables** for sensitive data

## Additional Features to Implement

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] Service image upload
- [ ] Advanced filtering and search
- [ ] Analytics dashboard
- [ ] Export data to CSV/Excel
- [ ] Audit logs

## Support

For issues or questions, please contact the development team.
