# Frontend Authentication Setup

## Overview
The frontend authentication system uses OAuth 2.0 with Google and Apple Sign In for user authentication. The system is built using Next.js and includes protected routes and a basic dashboard.

## Environment Setup

### Backend Environment Variables
```env
GOOGLE_CALLBACK_URL=https://wod-coach.ngrok.app/auth/google/callback
FRONTEND_URL=http://localhost:3001
API_URL=https://wod-coach.ngrok.app
```

### Frontend Environment Variables
```env
NEXT_PUBLIC_API_URL=https://wod-coach.ngrok.app
```

## Google OAuth Configuration

1. In Google Cloud Console:
   - Go to APIs & Services > Credentials
   - Configure OAuth 2.0 Client ID
   - Add Authorized JavaScript origins:
     ```
     http://localhost:3001
     https://wod-coach.ngrok.app
     ```
   - Add Authorized redirect URIs:
     ```
     https://wod-coach.ngrok.app/auth/google/callback
     ```

## Authentication Flow

1. User clicks "Sign in with Google" button
2. Backend redirects to Google's OAuth page
3. User authenticates with Google
4. Google redirects back to backend callback URL
5. Backend processes authentication and generates JWT token
6. Backend redirects to frontend callback URL with token
7. Frontend stores token and redirects to dashboard

## Protected Routes

The dashboard page (`/dashboard`) is protected and requires authentication:
- Checks for JWT token in localStorage
- Redirects to login if no token is present
- Displays loading state while checking authentication

## Development Setup

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3001`

## Future Improvements

### High Priority
1. Implement WOD Generation
   - Create WOD request form with user preferences
   - Display generated WOD with exercise details
   - Add ability to save favorite WODs

2. WOD History & Management
   - View past WODs
   - Filter and search WOD history
   - Track completion status
   - Add notes and ratings for completed WODs

3. User Profile & Progress
   - Display user's workout statistics
   - Track personal records
   - Set and monitor fitness goals

### Technical Improvements
1. Implement proper token refresh mechanism
2. Add error handling for failed authentication
3. Add session persistence
4. Implement proper route protection using middleware
5. Add loading states and error boundaries
6. Implement proper form validation
7. Add proper TypeScript types for API responses 