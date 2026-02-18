# Analytics API Setup with Axios & Debugging

## Overview
The analytics pages now use Axios for API calls with comprehensive debugging and error handling.

## Files Modified

### 1. `src/utils/api.ts` (New)
- Axios instance with interceptors for request/response logging
- Automatic authentication token handling
- Centralized error handling

### 2. `src/pages/admin/ServicesAnalytics.tsx`
- Updated to use Axios instead of fetch
- Added comprehensive debugging logs
- Enhanced error handling with specific error messages

### 3. `src/pages/admin/CoursesProductsAnalytics.tsx`
- Updated to use Axios instead of fetch
- Added comprehensive debugging logs
- Enhanced error handling with specific error messages

### 4. `src/utils/testAnalytics.ts` (New)
- Test script to verify API calls work correctly
- Can be run in browser console for debugging

## Features Added

### 🔍 Comprehensive Debugging
- Request/Response logging with timestamps
- Authentication token validation
- Data processing logs
- Error categorization (auth, network, server)

### 🚀 Axios Benefits
- Automatic JSON parsing
- Request/response interceptors
- Better error handling
- Timeout configuration
- Request cancellation support

### 🛡️ Enhanced Error Handling
- Specific error messages for different HTTP status codes
- Network error detection
- Authentication error handling
- User-friendly toast notifications

## Usage

### For Development
1. Start the backend server: `npm start` (in backend directory)
2. Run the seed script: `node seedAnalyticsData.js` (in backend directory)
3. Start the frontend: `npm run dev` (in frontend directory)
4. Navigate to admin analytics pages

### Debugging
1. Open browser DevTools Console
2. Look for logs prefixed with:
   - `🚀` - API requests
   - `✅` - Successful responses
   - `❌` - Errors
   - `📊` - Data processing
   - `⏳` - Loading states

### Testing API Calls
In browser console, run:
```javascript
import('./utils/testAnalytics.ts').then(module => module.default());
```
Or use the global function:
```javascript
testAnalyticsAPI();
```

## API Endpoints

### Services Analytics
- **URL**: `/api/admin/analytics/services`
- **Method**: GET
- **Auth**: Required (Bearer token)
- **Response**: Consultation booking analytics

### Courses/Products Analytics
- **URL**: `/api/admin/analytics/courses-products`
- **Method**: GET
- **Auth**: Required (Bearer token)
- **Response**: Digital product sales analytics

## Error Codes Handled

- **401**: Authentication failed - redirects to login
- **403**: Access denied - admin privileges required
- **Network errors**: Connection issues
- **Server errors**: 5xx responses with error details

## Troubleshooting

### No Data Showing
1. Check console for authentication errors
2. Verify backend is running on port 5000
3. Ensure admin user is logged in
4. Run seed script to populate test data

### API Errors
1. Check network tab in DevTools
2. Verify CORS configuration
3. Check backend logs for server errors
4. Validate JWT token expiration

### Charts Not Rendering
1. Check console for data processing errors
2. Verify analytics data structure
3. Check for null/undefined values in data

## Environment Variables

Make sure these are set in your `.env` file:
```
VITE_API_URL=http://localhost:5000/api
```

## Next Steps

1. Test the analytics pages with real data
2. Monitor console logs for any issues
3. Add more specific error handling if needed
4. Consider adding retry logic for failed requests